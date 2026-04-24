import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "@/core/routes/ProtectedRoute";
import { GuestRoute } from "@/core/routes/GuestRoute";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { SignUpPage } from "@/features/auth/pages/SignUpPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { VerifyCodePage } from "@/features/auth/pages/VerifyCodePage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { OAuth2CallbackPage } from "@/features/auth/pages/OAuth2CallbackPage";
import { PatientOnboardingPage } from "@/features/onboarding/pages/PatientOnboardingPage";
import { HomePage } from "@/features/dashboard/pages/HomePage";
import { PatientProfilePage } from "@/features/patient/pages/PatientProfilePage";
import { NotFoundPage } from "@/shared/components/NotFoundPage";
import { ErrorBoundaryPage } from "@/shared/components/ErrorBoundaryPage";

export const appRouter = createBrowserRouter([
  // ── Guest-only routes (redirect to / if already authenticated) ──
  {
    errorElement: <ErrorBoundaryPage />,
    element: <GuestRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/signup",
        element: <SignUpPage />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "/verify-code",
        element: <VerifyCodePage />,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },
  // ── Protected routes (redirect to /login if not authenticated) ──
  {
    errorElement: <ErrorBoundaryPage />,
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/onboarding/patient",
        element: <PatientOnboardingPage />,
      },
      {
        path: "/profile",
        element: <PatientProfilePage />,
      },
    ],
  },
  // ── OAuth2 callback (outside guards — user arrives mid-auth flow) ──
  {
    path: "/oauth2/callback",
    element: <OAuth2CallbackPage />,
    errorElement: <ErrorBoundaryPage />,
  },
  // ── Catch-all 404 ──
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
