import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { usePasswordStrength } from "../hooks/usePasswordStrength";
import { PasswordStrengthIndicator } from "../components/PasswordStrengthIndicator";

export const ResetPasswordPage = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const strength = usePasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (strength.isValidLength) {
      // Simulate success
      setIsSuccess(true);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-8 bg-background text-foreground font-sans relative transition-colors duration-500 ease-in-out">
      
      {/* Global Settings */}
      <SettingsBar />

      <div className="w-full max-w-[440px] space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Card Form */}
        <div className="bg-card text-card-foreground p-8 sm:p-10 rounded-xl sm:rounded-2xl border border-border shadow-md transition-colors duration-500">
          
          {!isSuccess ? (
            <>
              {/* Header */}
              <div className="flex flex-col mb-8">
                <h1 className="text-2xl font-bold tracking-tight mb-2">
                  {t("newPassword")}
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("newPasswordSubtitle")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t("newPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 text-base sm:text-sm pr-10 bg-background border-border placeholder:text-muted-foreground transition-all"
                      required
                      minLength={8}
                      maxLength={15}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors outline-none"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  
                  {/* Strength Indicator */}
                  <PasswordStrengthIndicator strength={strength} />
                  
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 leading-relaxed mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    {t("passwordHint")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    {t("confirmNewPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 text-base sm:text-sm pr-10 bg-background border-border placeholder:text-muted-foreground transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors outline-none"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all active:scale-[0.98]">
                  {t("updatePassword")}
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Success View */}
              <div className="flex flex-col items-center text-center animate-in zoom-in duration-500 py-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 rounded-full animate-ping bg-primary/20 scale-125"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-3">
                  {t("passwordUpdated")}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                  {t("passwordUpdatedSubtitle")}
                </p>
                
                <div className="w-full space-y-6">
                  <Button onClick={() => navigate("/login")} className="w-full h-12 flex items-center justify-center gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all active:scale-[0.98]">
                    {t("goToLogin")}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
                  </Button>
                  
                  <div className="pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground/80">
                      <a href="#" className="hover:text-primary transition-colors hover:underline">
                        {t("contactSupport")}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
