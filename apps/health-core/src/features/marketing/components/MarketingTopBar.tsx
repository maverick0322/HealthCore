import { Globe, Moon, Sun } from "lucide-react";
import i18n from "@/core/i18n";
import { SUPPORTED_LANGUAGES } from "@/core/i18n";
import { useSettingsStore } from "@/core/store/useSettingsStore";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export const MarketingTopBar = () => {
  const { theme, setTheme, setLanguage } = useSettingsStore();

  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="flex items-center gap-2">
        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/15">
          <img src="/icon-192.png" alt="HealthCore Logo" className="rounded-xl"/>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Select
            value={i18n.language}
            onValueChange={(lang) => setLanguage(lang)}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full w-9 h-9 border-border bg-card hover:bg-muted text-foreground transition-all duration-300 shadow-sm"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  );
};

