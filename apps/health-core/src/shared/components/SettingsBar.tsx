import { Moon, Sun, Globe, Settings, LogOut, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { useSettingsStore } from "@/core/store/useSettingsStore";
import { SUPPORTED_LANGUAGES } from "@/core/i18n";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";

interface SettingsBarProps {
  readonly className?: string;
  readonly showAccountMenu?: boolean;
}

export const SettingsBar = ({
  className,
  showAccountMenu = true,
}: SettingsBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("auth");
  const { theme, setTheme, language, setLanguage } = useSettingsStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isDark = theme === "dark" || (theme === "system" && globalThis.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const containerClass = className ?? "absolute top-4 right-4 flex items-center gap-2 z-50";

  const isAuthRoute =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/verify-code" ||
    location.pathname === "/reset-password";

  const shouldShowAccountMenu = showAccountMenu && Boolean(user) && !isAuthRoute;
  const profilePath =
    user?.role === "NUTRITIONIST"
      ? "/profile/nutritionist"
      : user?.role === "PATIENT"
        ? "/profile"
        : "/profile";

  return (
    <div className={containerClass}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="relative rounded-full w-10 h-10 border-border bg-card hover:bg-muted text-foreground transition-all duration-300 shadow-sm outline-none ring-0"
          >
            <Globe className="w-5 h-5" />
            <span className="sr-only">{t("selectLanguage")}</span>
            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-primary text-primary-foreground px-1.5 rounded-full shadow-sm">
              {language.toUpperCase()}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 border-border bg-card shadow-lg">
          {SUPPORTED_LANGUAGES.map((lang: { code: string; name: string }) => (
            <DropdownMenuItem 
              key={lang.code} 
              onClick={() => setLanguage(lang.code)}
              className={`cursor-pointer transition-colors ${language === lang.code ? "bg-muted font-bold text-primary" : ""}`}
            >
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button 
        variant="outline" 
        size="icon" 
        onClick={toggleTheme} 
        className="rounded-full w-10 h-10 border-border bg-card hover:bg-muted text-foreground transition-all duration-300 shadow-sm"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        <span className="sr-only">{t("toggleTheme")}</span>
      </Button>

      {shouldShowAccountMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full w-10 h-10 border-border bg-card hover:bg-muted text-foreground transition-all duration-300 shadow-sm outline-none ring-0"
            >
              <Settings className="w-5 h-5" />
              <span className="sr-only">{t("settings")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border-border bg-card shadow-lg">
            {user?.role !== "ADMIN" && (
              <DropdownMenuItem onClick={() => navigate(profilePath)} className="cursor-pointer">
                <User className="mr-2 w-4 h-4" />
                <span>{t("profile")}</span>
              </DropdownMenuItem>
            )}
            {user?.role !== "ADMIN" && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="mr-2 w-4 h-4" />
              <span>{t("logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

