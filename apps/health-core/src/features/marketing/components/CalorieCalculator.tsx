import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Slider } from "@/shared/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

type Sex = "male" | "female";

const activityOptions = [
  { key: "0", multiplier: 1.2 },
  { key: "1", multiplier: 1.375 },
  { key: "2", multiplier: 1.55 },
  { key: "3", multiplier: 1.725 },
  { key: "4", multiplier: 1.9 },
] as const;

export const CalorieCalculator = () => {
  const { t } = useTranslation("marketing");

  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState<number>(30);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(170);
  const [activityIndex, setActivityIndex] = useState<number>(2);

  const { bmr, tdee, activityLabel } = useMemo(() => {
    const safeAge = Number.isFinite(age) ? Math.max(10, Math.min(120, age)) : 30;
    const safeWeight = Number.isFinite(weightKg) ? Math.max(30, Math.min(300, weightKg)) : 70;
    const safeHeight = Number.isFinite(heightCm) ? Math.max(120, Math.min(230, heightCm)) : 170;
    const safeActivityIndex = Math.max(0, Math.min(activityOptions.length - 1, activityIndex));

    // Mifflin-St Jeor
    const base = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge;
    const sexConstant = sex === "male" ? 5 : -161;
    const bmrValue = base + sexConstant;

    const multiplier = activityOptions[safeActivityIndex].multiplier;
    const tdeeValue = bmrValue * multiplier;

    return {
      bmr: Math.round(bmrValue),
      tdee: Math.round(tdeeValue),
      activityLabel: t(`calculator.activityLevels.${activityOptions[safeActivityIndex].key}`),
    };
  }, [age, weightKg, heightCm, sex, activityIndex, t]);

  return (
    <Card className="bg-card/60">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{t("explore.calcTitle")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("explore.calcBody")}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("calculator.sex")}</Label>
            <Select value={sex} onValueChange={(v) => setSex(v as Sex)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("calculator.male")}</SelectItem>
                <SelectItem value="female">{t("calculator.female")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">{t("calculator.age")}</Label>
            <Input
              id="age"
              type="number"
              inputMode="numeric"
              min={10}
              max={120}
              value={age || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= 3) {
                  setAge(val === "" ? 0 : Number(val));
                }
              }}
              maxLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">{t("calculator.weight")}</Label>
            <Input
              id="weight"
              type="number"
              inputMode="decimal"
              min={30}
              max={300}
              step={0.1}
              value={weightKg || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= 5) {
                  setWeightKg(val === "" ? 0 : Number(val));
                }
              }}
              maxLength={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">{t("calculator.height")}</Label>
            <Input
              id="height"
              type="number"
              inputMode="decimal"
              min={120}
              max={230}
              step={0.1}
              value={heightCm || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= 5) {
                  setHeightCm(val === "" ? 0 : Number(val));
                }
              }}
              maxLength={5}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label>{t("calculator.activity")}</Label>
            <span className="text-xs text-muted-foreground">{activityLabel}</span>
          </div>
          <Slider
            value={[activityIndex]}
            min={0}
            max={4}
            step={1}
            onValueChange={(v) => setActivityIndex(v[0] ?? 2)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-background/70 p-4">
            <div className="text-xs text-muted-foreground">{t("calculator.bmr")}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{bmr}</div>
          </div>
          <div className="rounded-xl border border-border bg-background/70 p-4">
            <div className="text-xs text-muted-foreground">{t("calculator.tdee")}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{tdee}</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{t("calculator.disclaimer")}</p>
      </CardContent>
    </Card>
  );
};

