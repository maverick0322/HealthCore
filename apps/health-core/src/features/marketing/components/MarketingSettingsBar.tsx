import { Globe, Moon, Sun } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { useSettingsStore } from "@/core/store/useSettingsStore";
import { SUPPORTED_LANGUAGES } from "@/core/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export const MarketingSettingsBar = ({ className }: { className?: string }) => {
  const { theme, setTheme, language, setLanguage } = useSettingsStore();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const containerClass =
    className ?? "relative flex justify-end gap-2 p-4 sm:absolute sm:top-4 sm:right-4 sm:p-0 sm:z-50";

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
            <span className="sr-only">Select language</span>
            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-primary text-primary-foreground px-1.5 rounded-full shadow-sm">
              {language.toUpperCase()}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-40 border-border bg-card shadow-lg"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`cursor-pointer transition-colors ${
                language === lang.code ? "bg-muted font-bold text-primary" : ""
              }`}
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
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
};

