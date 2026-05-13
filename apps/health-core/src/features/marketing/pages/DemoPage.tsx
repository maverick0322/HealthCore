import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, MessageCircle, Plus, Salad, Trash2 } from "lucide-react";

import { MarketingTopBar } from "@/features/marketing/components/MarketingTopBar";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

type DemoFood = {
  id: string;
  name: string;
  kcal: number;
};

const FOODS: DemoFood[] = [
  { id: "oats", name: "Avena (50g)", kcal: 190 },
  { id: "banana", name: "Plátano", kcal: 105 },
  { id: "yogurt", name: "Yogurt natural", kcal: 120 },
  { id: "eggs", name: "Huevos (2)", kcal: 156 },
  { id: "coffee", name: "Café", kcal: 5 },
];

export const DemoPage = () => {
  const { t } = useTranslation("marketing");

  const [selected, setSelected] = useState<DemoFood[]>([
    FOODS[0]!,
    FOODS[1]!,
    FOODS[4]!,
  ]);

  const totalKcal = useMemo(
    () => selected.reduce((sum, f) => sum + f.kcal, 0),
    [selected]
  );

  const addFood = (food: DemoFood) => {
    setSelected((prev) => [...prev, food]);
  };

  const removeFood = (id: string) => {
    setSelected((prev) => prev.filter((f) => f.id !== id));
  };

  const reset = () => setSelected([FOODS[0]!, FOODS[1]!, FOODS[4]!]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4">
        <MarketingTopBar />

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
              <Link to="/signup">{t("demo.saveCta")}</Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="self" className="pb-14">
          <TabsList>
            <TabsTrigger value="self">{t("demo.tabs.self")}</TabsTrigger>
            <TabsTrigger value="pro">{t("demo.tabs.pro")}</TabsTrigger>
          </TabsList>

          <TabsContent value="self" className="mt-6">
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
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      {selected.map((food) => (
                        <div key={food.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{food.name}</div>
                            <div className="text-xs text-muted-foreground">{food.kcal} kcal</div>
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
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">{t("demo.self.insights")}</div>
                      <Badge variant="outline" className="gap-1">
                        <Check className="h-3.5 w-3.5" />
                        OK
                      </Badge>
                    </div>
                    <div className="mt-3 h-20 rounded-lg bg-muted" />
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-10 rounded-lg bg-muted" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("demo.self.note")}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pro" className="mt-6">
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
                    <div className="mt-2 rounded-xl bg-muted/50 p-4">
                      <p className="text-sm leading-relaxed">{t("demo.pro.comment")}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <div className="text-xs text-muted-foreground">{t("demo.pro.adjustments")}</div>
                    <div className="mt-3 space-y-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-10 rounded-lg bg-muted" />
                      ))}
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
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <div className="h-10 flex-1 rounded-lg bg-muted" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("demo.pro.note")}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

