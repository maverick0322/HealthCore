import { useTranslation } from "react-i18next";
import type { PasswordStrength } from "../hooks/usePasswordStrength";

interface Props {
  readonly strength: PasswordStrength;
}

export function PasswordStrengthIndicator({ strength }: Readonly<Props>) {
  const { t } = useTranslation("auth");
  const { score, labelKey } = strength;

  const getActiveColor = () => {
    switch (score) {
      case 0: return "bg-red-400";
      case 1: return "bg-orange-400";
      case 2: return "bg-amber-400";
      case 3: return "bg-green-500";
      default: return "bg-transparent";
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-1 h-1.5 w-full bg-muted rounded-full overflow-hidden mt-2">
        <div className={`w-1/3 rounded-full transition-all duration-300 ${score >= 1 ? getActiveColor() : "bg-transparent"}`}></div>
        <div className={`w-1/3 rounded-full transition-all duration-300 ${score >= 2 ? getActiveColor() : "bg-transparent"}`}></div>
        <div className={`w-1/3 rounded-full transition-all duration-300 ${score >= 3 ? getActiveColor() : "bg-transparent"}`}></div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        {t("securityLevel")} <span className="font-medium">{t(labelKey)}</span>
      </p>
    </div>
  );
}
