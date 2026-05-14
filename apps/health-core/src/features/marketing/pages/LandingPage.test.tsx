import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@/test/test-utils";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  it("renders primary CTA without requiring login", () => {
    render(<LandingPage />);
    expect(screen.getByRole("button", { name: /start now/i })).toBeInTheDocument();
  });

  it("shows 'Go to app' CTA when authenticated", () => {
    useAuthStore.getState().setTokens({
      accessToken: "at-123",
      refreshToken: "rt-456",
      tokenType: "Bearer",
      accessTokenExpiresInMs: 300000,
      refreshTokenExpiresInMs: 86400000,
    });

    render(<LandingPage />);
    const links = screen.getAllByRole("link", { name: /go to app/i });
    expect(links.some((l) => l.getAttribute("href") === "/home")).toBe(true);
  });
});
