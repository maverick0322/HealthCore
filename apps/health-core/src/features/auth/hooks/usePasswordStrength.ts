import { useMemo } from "react";

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3;
  labelKey: "securityLow" | "securityMedium" | "securityHigh" | "securityVeryHigh";
  isValidLength: boolean;
};

export function usePasswordStrength(password: string): PasswordStrength {
  return useMemo(() => {
    let score = 0;
    
    const isValidLength = password.length >= 8 && password.length <= 15;
    
    if (password.length > 0) {
      if (password.length >= 8) score += 1;
      if (/\d/.test(password)) score += 1;
      if (/[^A-Za-z0-9]/.test(password)) score += 1;
    }

    const finalScore = Math.min(Math.max(score, 0), 3) as 0 | 1 | 2 | 3;
    
    const labels: Record<number, PasswordStrength["labelKey"]> = {
      0: "securityLow",
      1: "securityMedium",
      2: "securityHigh",
      3: "securityVeryHigh"
    };

    return {
      score: finalScore,
      labelKey: labels[finalScore],
      isValidLength
    };
  }, [password]);
}
