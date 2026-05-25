import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { FieldError } from "@/shared/components/FieldError";
import { ENV } from "@/core/config/env";
import { useLogin } from "../hooks/useLogin";
import logoIcon from "@/assets/icon-192.png";

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { t, i18n } = useTranslation("auth");
  const { handleLogin, isLoading, error, fieldErrors } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin({ email, password });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-8 bg-background text-foreground font-sans relative transition-colors duration-500 ease-in-out">

      {/* Top Controls */}
      <SettingsBar />

      <div className="w-full max-w-md w-full sm:w-[420px] space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-xl flex items-center justify-center shadow-inner transition-transform hover:scale-105 duration-300">
            {/* Logo */}
            <img src={logoIcon} alt="HealthCore" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight transition-colors">
              {t("welcome")}
            </h1>
            <p className="text-sm text-muted-foreground px-4 transition-colors">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-card text-card-foreground p-5 sm:p-8 rounded-xl sm:rounded-2xl border border-border shadow-md space-y-5 sm:space-y-6 transition-colors duration-500">

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-11 sm:h-10 text-sm bg-background hover:bg-muted border-border transition-colors font-medium"
              onClick={() => {
                window.location.href = `${ENV.IDENTITY_SERVICE_URL}/oauth2/authorization/auth0?ui_locales=${i18n.language}`;
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t("google")}
            </Button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium uppercase text-muted-foreground bg-card ring-8 ring-card">
              {t("or")}
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {/* Server error banner */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="email" className="text-sm font-medium">{t("email")}</Label>
                <span className="text-xs text-muted-foreground">
                  {email.length}/254
                </span>
              </div>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                className="h-11 sm:h-10 text-base sm:text-sm bg-background border-border placeholder:text-muted-foreground"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                disabled={isLoading}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                aria-invalid={!!fieldErrors.email}
              />
              <FieldError id="email-error" message={fieldErrors.email} />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="password" className="text-sm font-medium">{t("password")}</Label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline hover:text-primary/80 transition-colors">
                    {t("forgot")}
                  </Link>
                </div>
                <span className="text-xs text-muted-foreground">
                  {password.length}/72
                </span>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  className="h-11 sm:h-10 text-base sm:text-sm pr-10 bg-background border-border placeholder:text-muted-foreground"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={72}
                  disabled={isLoading}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  aria-invalid={!!fieldErrors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                  aria-label={showPassword ? t("passwordPlaceholder") : t("passwordPlaceholder")}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <FieldError id="password-error" message={fieldErrors.password} />
            </div>
            <Button
              type="submit"
              className="w-full h-11 sm:h-10 font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-2 shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("submit")
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline hover:text-primary/80 transition-colors">
            {t("register")}
          </Link>
        </p>

        <footer className="text-center pt-4 sm:pt-8 pb-4">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
            {t("footer")}
          </p>
        </footer>
      </div>
    </div>
  );
};
