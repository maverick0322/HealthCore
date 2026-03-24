import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { SettingsBar } from "@/shared/components/SettingsBar";

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"paciente" | "nutriologo">("paciente");
  const { t } = useTranslation("auth");

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-8 bg-background text-foreground font-sans relative transition-colors duration-500 ease-in-out">

      {/* Top Controls */}
      <SettingsBar />

      <div className="w-full max-w-md w-full sm:w-[420px] space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-xl flex items-center justify-center shadow-inner transition-transform hover:scale-105 duration-300">
            {/* Logo */}
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
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

          <div className="relative flex w-full p-1 bg-muted rounded-lg select-none">
            {/* Animated Pill Container */}
            <div className="absolute inset-1 flex">
              <div
                className={`w-1/2 h-full bg-background rounded-md shadow-sm transition-transform duration-300 ease-in-out ${role === "paciente" ? "translate-x-0" : "translate-x-full"
                  }`}
              />
            </div>

            <button
              onClick={() => setRole("paciente")}
              className={`relative z-10 w-1/2 py-1.5 text-sm font-medium transition-colors duration-300 rounded-md ${role === "paciente" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t("patient")}
            </button>
            <button
              onClick={() => setRole("nutriologo")}
              className={`relative z-10 w-1/2 py-1.5 text-sm font-medium transition-colors duration-300 rounded-md ${role === "nutriologo" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t("nutritionist")}
            </button>
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full flex items-center justify-center gap-3 h-11 sm:h-10 text-sm bg-background hover:bg-muted border-border transition-colors font-medium">
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
            <Button variant="outline" className="w-full flex items-center justify-center gap-3 h-11 sm:h-10 text-sm bg-background hover:bg-muted border-border transition-colors font-medium">
              <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
              </svg>
              {t("facebook")}
            </Button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium uppercase text-muted-foreground bg-card ring-8 ring-card">
              {t("or")}
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <form className="space-y-4 sm:space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                className="h-11 sm:h-10 text-base sm:text-sm bg-background border-border placeholder:text-muted-foreground"
                required
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">{t("password")}</Label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline hover:text-primary/80 transition-colors">
                  {t("forgot")}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  className="h-11 sm:h-10 text-base sm:text-sm pr-10 bg-background border-border placeholder:text-muted-foreground"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 sm:h-10 font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-2 shadow-sm">
              {t("submit")}
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
