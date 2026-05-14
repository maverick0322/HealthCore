import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LineChart,
  MessageCircle,
  User,
} from "lucide-react";

import { MarketingSettingsBar } from "@/features/marketing/components/MarketingSettingsBar";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { Slider } from "@/shared/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

type Sex = "male" | "female";
type Goal = "lose" | "maintain" | "gain";
type StepId = "profile" | "log" | "progress" | "nutritionist";

const steps: Array<{ id: StepId; icon: React.ReactNode }> = [
  { id: "profile", icon: <User className="h-4 w-4" /> },
  { id: "log", icon: <ClipboardList className="h-4 w-4" /> },
  { id: "progress", icon: <LineChart className="h-4 w-4" /> },
  { id: "nutritionist", icon: <MessageCircle className="h-4 w-4" /> },
];

const activityMultipliers = [1.2, 1.375, 1.55, 1.725, 1.9] as const;

function clampNumber(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function mifflinStJeor({
  sex,
  age,
  weightKg,
  heightCm,
  activityIndex,
}: {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activityIndex: number;
}) {
  const safeAge = clampNumber(age, 10, 120, 30);
  const safeWeight = clampNumber(weightKg, 30, 300, 70);
  const safeHeight = clampNumber(heightCm, 120, 230, 170);
  const safeActivityIndex = clampNumber(activityIndex, 0, 4, 2);

  const base = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge;
  const sexConstant = sex === "male" ? 5 : -161;
  const bmr = base + sexConstant;
  const tdee = bmr * activityMultipliers[safeActivityIndex];

  return { bmr: Math.round(bmr), tdee: Math.round(tdee) };
}

export const TourPage = () => {
  const { t } = useTranslation("marketing");

  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex]!.id;

  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(170);
  const [activityIndex, setActivityIndex] = useState(2);
  const [goal, setGoal] = useState<Goal>("maintain");

  const { bmr, tdee } = useMemo(
    () => mifflinStJeor({ sex, age, weightKg, heightCm, activityIndex }),
    [sex, age, weightKg, heightCm, activityIndex]
  );

  const goalDelta = goal === "lose" ? -350 : goal === "gain" ? 250 : 0;
  const target = tdee + goalDelta;

  const activityLabel = t(`calculator.activityLevels.${String(activityIndex)}`);

  const goPrev = () => setStepIndex((i) => Math.max(0, i - 1));
  const goNext = () => setStepIndex((i) => Math.min(steps.length - 1, i + 1));

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <MarketingSettingsBar />
      <div className="max-w-6xl mx-auto px-4">
        <div className="py-4" />

        <div className="flex items-start justify-between gap-4 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{t("tour.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("tour.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/">{t("tour.back")}</Link>
            </Button>
            <Button asChild>
              <Link to="/demo">{t("tour.tryDemo")}</Link>
            </Button>
          </div>
        </div>

        <div className="pb-14 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          <Card className="h-fit">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">{t("tour.profileCardTitle")}</CardTitle>
              <CardDescription>{t("tour.profileCardBody")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
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
                  <Label htmlFor="tour-age">{t("calculator.age")}</Label>
                  <Input
                    id="tour-age"
                    type="number"
                    min={10}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tour-weight">{t("calculator.weight")}</Label>
                  <Input
                    id="tour-weight"
                    type="number"
                    min={30}
                    max={300}
                    step={0.1}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tour-height">{t("calculator.height")}</Label>
                  <Input
                    id="tour-height"
                    type="number"
                    min={120}
                    max={230}
                    step={0.1}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
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

              <div className="space-y-2">
                <Label>{t("tour.goal")}</Label>
                <Select value={goal} onValueChange={(v) => setGoal(v as Goal)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose">{t("tour.goals.lose")}</SelectItem>
                    <SelectItem value="maintain">{t("tour.goals.maintain")}</SelectItem>
                    <SelectItem value="gain">{t("tour.goals.gain")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border bg-background/70 p-3">
                  <div className="text-[11px] text-muted-foreground">{t("calculator.bmr")}</div>
                  <div className="mt-1 text-base font-semibold">{bmr}</div>
                </div>
                <div className="rounded-lg border border-border bg-background/70 p-3">
                  <div className="text-[11px] text-muted-foreground">{t("calculator.tdee")}</div>
                  <div className="mt-1 text-base font-semibold">{tdee}</div>
                </div>
                <div className="rounded-lg border border-border bg-background/70 p-3">
                  <div className="text-[11px] text-muted-foreground">{t("tour.target")}</div>
                  <div className="mt-1 text-base font-semibold">{target}</div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">{t("calculator.disclaimer")}</p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {steps.map((s, idx) => {
                const isActive = idx === stepIndex;
                const isDone = idx < stepIndex;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStepIndex(idx)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition-all ${
                      isActive
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted text-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.icon}
                    {t(`tour.steps.${s.id}.label`)}
                  </button>
                );
              })}
            </div>

            {step === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("tour.steps.profile.title")}</CardTitle>
                  <CardDescription>{t("tour.steps.profile.body")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="text-xs text-muted-foreground">{t("tour.steps.profile.card1Title")}</div>
                      <div className="mt-2 text-sm font-semibold">{t("tour.steps.profile.card1Body")}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="text-xs text-muted-foreground">{t("tour.steps.profile.card2Title")}</div>
                      <div className="mt-2 text-sm font-semibold">{t("tour.steps.profile.card2Body")}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="text-xs text-muted-foreground">{t("tour.steps.profile.card3Title")}</div>
                      <div className="mt-2 text-sm font-semibold">{t("tour.steps.profile.card3Body")}</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    {t("tour.hintProfile")}
                  </div>
                </CardContent>
              </Card>
            )}

            {step === "log" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("tour.steps.log.title")}</CardTitle>
                  <CardDescription>{t("tour.steps.log.body")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">{t("tour.steps.log.sampleDay")}</div>
                      <Badge variant="secondary">{t("tour.sample")}</Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      {["Breakfast", "Lunch", "Dinner"].map((meal) => (
                        <div key={meal} className="rounded-xl border border-border bg-card p-3">
                          <div className="text-xs text-muted-foreground">{t(`tour.meals.${meal.toLowerCase()}`)}</div>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{t("tour.foods.oats")}</span>
                              <span className="text-muted-foreground">190</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{t("tour.foods.banana")}</span>
                              <span className="text-muted-foreground">105</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{t("tour.foods.yogurt")}</span>
                              <span className="text-muted-foreground">120</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    {t("tour.hintLog")}
                  </div>
                </CardContent>
              </Card>
            )}

            {step === "progress" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("tour.steps.progress.title")}</CardTitle>
                  <CardDescription>{t("tour.steps.progress.body")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="text-xs text-muted-foreground">{t("tour.steps.progress.metric1")}</div>
                      <div className="mt-1 text-2xl font-bold">{Math.round(target)} kcal</div>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "62%" }} />
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="text-xs text-muted-foreground">{t("tour.steps.progress.metric2")}</div>
                      <div className="mt-1 text-2xl font-bold">4/7</div>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "57%" }} />
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="text-xs text-muted-foreground">{t("tour.steps.progress.metric3")}</div>
                      <div className="mt-1 text-2xl font-bold">+2</div>
                      <div className="mt-2 text-sm text-muted-foreground">{t("tour.steps.progress.metric3Body")}</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    {t("tour.hintProgress")}
                  </div>
                </CardContent>
              </Card>
            )}

            {step === "nutritionist" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("tour.steps.nutritionist.title")}</CardTitle>
                  <CardDescription>{t("tour.steps.nutritionist.body")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">{t("tour.steps.nutritionist.thread")}</div>
                      <Badge variant="secondary">{t("tour.sample")}</Badge>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex gap-2">
                        <div className="mt-1 h-7 w-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                          N
                        </div>
                        <div className="flex-1 rounded-2xl rounded-tl-md bg-muted/50 p-4">
                          <p className="text-sm leading-relaxed">{t("tour.steps.nutritionist.msg1")}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <div className="flex-1 max-w-[80%] rounded-2xl rounded-tr-md bg-primary/10 p-4">
                          <p className="text-sm leading-relaxed">{t("tour.steps.nutritionist.msg2")}</p>
                        </div>
                        <div className="mt-1 h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-bold">
                          {t("tour.you")}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    {t("tour.hintNutritionist")}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between pt-1">
              <Button variant="outline" onClick={goPrev} disabled={stepIndex === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("tour.prev")}
              </Button>
              <Button onClick={goNext} disabled={stepIndex === steps.length - 1}>
                {t("tour.next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
