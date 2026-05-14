import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, MessageCircle, Plus, Salad, Trash2 } from "lucide-react";

import { MarketingSettingsBar } from "@/features/marketing/components/MarketingSettingsBar";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";

type DemoFood = {
  id: string;
  name: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
};

const FOODS: DemoFood[] = [
  { id: "oats", name: "Avena (50g)", kcal: 190, p: 6, c: 32, f: 3 },
  { id: "banana", name: "Plátano", kcal: 105, p: 1, c: 27, f: 0 },
  { id: "yogurt", name: "Yogurt natural", kcal: 120, p: 10, c: 8, f: 5 },
  { id: "eggs", name: "Huevos (2)", kcal: 156, p: 12, c: 1, f: 11 },
  { id: "coffee", name: "Café", kcal: 5, p: 0, c: 0, f: 0 },
];

export const DemoPage = () => {
  const { t } = useTranslation("marketing");

  const [mode, setMode] = useState<"self" | "pro">("self");
  const [selected, setSelected] = useState<DemoFood[]>([
    FOODS[0]!,
    FOODS[1]!,
    FOODS[4]!,
  ]);

  const totalKcal = useMemo(
    () => selected.reduce((sum, f) => sum + f.kcal, 0),
    [selected]
  );

  const macros = useMemo(() => {
    const totals = selected.reduce(
      (acc, f) => ({
        p: acc.p + f.p,
        c: acc.c + f.c,
        f: acc.f + f.f,
      }),
      { p: 0, c: 0, f: 0 }
    );
    return {
      p: Math.round(totals.p),
      c: Math.round(totals.c),
      f: Math.round(totals.f),
    };
  }, [selected]);

  const targetKcal = 500;
  const progress = Math.min(100, Math.round((totalKcal / targetKcal) * 100));

  const dayLabel = t("demo.labels.day");
  const weekLabel = t("demo.labels.week");
  const dailyLabel = t("demo.labels.daily");

  const addFood = (food: DemoFood) => {
    setSelected((prev) => [...prev, food]);
  };

  const removeFood = (id: string) => {
    setSelected((prev) => prev.filter((f) => f.id !== id));
  };

  const reset = () => setSelected([FOODS[0]!, FOODS[1]!, FOODS[4]!]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <MarketingSettingsBar />
      <div className="max-w-6xl mx-auto px-4">
        <div className="py-4" />

        <div className="flex items-center justify-between gap-3 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{t("demo.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("demo.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/">{t("demo.back")}</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">{t("demo.primaryCta")}</Link>
            </Button>
          </div>
        </div>

        <div className="pb-14">
          <div className="mt-2 inline-flex w-full max-w-xl rounded-xl border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("self")}
              aria-pressed={mode === "self"}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                mode === "self"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("demo.tabs.self")}
            </button>
            <button
              type="button"
              onClick={() => setMode("pro")}
              aria-pressed={mode === "pro"}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                mode === "pro"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("demo.tabs.pro")}
            </button>
          </div>

          <div className="mt-6">
          {mode === "self" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{t("demo.self.title")}</CardTitle>
                    <Badge variant="secondary" className="gap-1">
                      <Salad className="h-3.5 w-3.5" />
                      {t("demo.self.badge")}
                    </Badge>
                  </div>
                  <CardDescription>{t("demo.self.body")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">{t("demo.self.total")}</div>
                      <div className="text-lg font-semibold">{totalKcal} kcal</div>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{progress}%</span>
                      <span>{targetKcal} kcal</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      {selected.map((food) => (
                        <div key={food.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{food.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {food.kcal} kcal · P {food.p}g · C {food.c}g · F {food.f}g
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeFood(food.id)}
                            aria-label={t("demo.self.remove")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">{t("demo.self.addHint")}</div>
                    <Button variant="outline" size="sm" onClick={reset}>
                      {t("demo.self.reset")}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FOODS.map((food) => (
                      <Button
                        key={food.id}
                        variant="outline"
                        className="justify-between"
                        onClick={() => addFood(food)}
                      >
                        <span className="truncate">{food.name}</span>
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-xs">{food.kcal}</span>
                          <Plus className="h-4 w-4" />
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60">
                <CardHeader>
                  <CardTitle className="text-base">{t("demo.self.previewTitle")}</CardTitle>
                  <CardDescription>{t("demo.self.previewBody")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border bg-background/70 p-3">
                      <div className="text-[11px] text-muted-foreground">{t("demo.self.macros.protein")}</div>
                      <div className="mt-1 text-lg font-semibold">{macros.p}g</div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-3">
                      <div className="text-[11px] text-muted-foreground">{t("demo.self.macros.carbs")}</div>
                      <div className="mt-1 text-lg font-semibold">{macros.c}g</div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-3">
                      <div className="text-[11px] text-muted-foreground">{t("demo.self.macros.fat")}</div>
                      <div className="mt-1 text-lg font-semibold">{macros.f}g</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">{t("demo.self.insights")}</div>
                      <Badge variant="outline" className="gap-1">
                        <Check className="h-3.5 w-3.5" />
                        OK
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t("demo.self.insightsConsistency")}</span>
                        <span className="font-medium">4/7</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "57%" }} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t("demo.self.macros.protein")}</span>
                        <span className="font-medium">{macros.p}g</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, (macros.p / 30) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("demo.self.note")}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{t("demo.pro.title")}</CardTitle>
                    <Badge variant="secondary" className="gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {t("demo.pro.badge")}
                    </Badge>
                  </div>
                  <CardDescription>{t("demo.pro.body")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <div className="text-xs text-muted-foreground">{t("demo.pro.commentLabel")}</div>
                    <div className="mt-3 space-y-3">
                      <div className="flex gap-2">
                        <div className="mt-1 h-7 w-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                          N
                        </div>
                        <div className="flex-1 rounded-2xl rounded-tl-md bg-muted/50 p-4">
                          <p className="text-sm leading-relaxed">{t("demo.pro.comment")}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <div className="flex-1 max-w-[80%] rounded-2xl rounded-tr-md bg-primary/10 p-4">
                          <p className="text-sm leading-relaxed">
                            {t("demo.pro.userMessage")}
                          </p>
                        </div>
                        <div className="mt-1 h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-bold">
                          {t("demo.pro.you")}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <div className="text-xs text-muted-foreground">{t("demo.pro.adjustments")}</div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                        <span className="text-sm">{t("demo.pro.adjustmentItems.fruit")}</span>
                        <Badge variant="secondary">{dayLabel}</Badge>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                        <span className="text-sm">{t("demo.pro.adjustmentItems.proteinBreakfast")}</span>
                        <Badge variant="secondary">{weekLabel}</Badge>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                        <span className="text-sm">{t("demo.pro.adjustmentItems.water")}</span>
                        <Badge variant="secondary">{dailyLabel}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60">
                <CardHeader>
                  <CardTitle className="text-base">{t("demo.pro.previewTitle")}</CardTitle>
                  <CardDescription>{t("demo.pro.previewBody")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <div className="text-xs text-muted-foreground">{t("demo.pro.timeline")}</div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                          {t("demo.pro.timelineItems.breakfastReview")}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                          {t("demo.pro.timelineItems.goalAdjustment")}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                          {t("demo.pro.timelineItems.snackRecommendation")}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("demo.pro.note")}</p>
                </CardContent>
              </Card>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
