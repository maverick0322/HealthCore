import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MessageCircle,
  Salad,
  TrendingUp,
  PlayCircle,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  Users,
  ClipboardList,
} from "lucide-react";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { MarketingSettingsBar } from "@/features/marketing/components/MarketingSettingsBar";
import { CalorieCalculator } from "@/features/marketing/components/CalorieCalculator";

export const LandingPage = () => {
  const { t } = useTranslation("marketing");
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const scrollToHow = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <MarketingSettingsBar />
      <div className="bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="py-4" />

          <div className="flex items-center justify-between gap-3 pb-6">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/15">
                <img src="/icon-192.png" alt="HealthCore" className="rounded-xl" />
              </div>
              <span className="text-sm font-semibold tracking-tight">{t("brand")}</span>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {isAuthenticated ? t("nav.goToApp") : t("nav.preview")}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <Button asChild className="hidden sm:inline-flex">
                  <Link to="/dashboard">{t("nav.goToApp")}</Link>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link to="/login">{t("nav.login")}</Link>
              </Button>
            </div>
          </div>

          <section className="py-12 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/15">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t("value.title")}</span>
                </div>

                <h1 className="scroll-m-20 text-4xl sm:text-5xl font-bold tracking-tight">
                  {t("hero.title")}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t("hero.subtitle")}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    onClick={() => navigate("/demo")}
                    className="h-11"
                  >
                    {t("hero.primaryCta")}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={scrollToHow}
                    className="h-11"
                  >
                    {t("hero.secondaryCta")}
                  </Button>
                </div>

                {isAuthenticated && (
                  <div className="pt-2">
                    <Button variant="ghost" asChild className="px-0">
                      <Link to="/dashboard" className="inline-flex items-center gap-1.5">
                        {t("nav.goToApp")}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" />
                <Card className="relative overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{t("heroMock.title")}</CardTitle>
                      <Badge variant="outline">{t("heroMock.today")}</Badge>
                    </div>
                    <CardDescription>
                      {t("heroMock.subtitle")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-border bg-background/70 p-3">
                        <div className="text-[11px] text-muted-foreground">{t("heroMock.meals.breakfast")}</div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{t("heroMock.items.oats")}</span>
                            <span className="text-muted-foreground">190</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{t("heroMock.items.banana")}</span>
                            <span className="text-muted-foreground">105</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{t("heroMock.items.coffee")}</span>
                            <span className="text-muted-foreground">5</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-border bg-background/70 p-3">
                        <div className="text-[11px] text-muted-foreground">{t("heroMock.meals.lunch")}</div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{t("heroMock.items.chicken")}</span>
                            <span className="text-muted-foreground">220</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{t("heroMock.items.rice")}</span>
                            <span className="text-muted-foreground">210</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{t("heroMock.items.salad")}</span>
                            <span className="text-muted-foreground">80</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-border bg-background/70 p-3">
                        <div className="text-[11px] text-muted-foreground">{t("heroMock.meals.dinner")}</div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{t("heroMock.items.yogurt")}</span>
                            <span className="text-muted-foreground">120</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{t("heroMock.items.fruit")}</span>
                            <span className="text-muted-foreground">90</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{t("heroMock.items.water")}</span>
                            <span className="text-muted-foreground">0</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] text-muted-foreground">{t("heroMock.weeklyTrend")}</div>
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <div className="mt-3 grid grid-cols-7 gap-1 items-end">
                        {[28, 34, 22, 41, 30, 38, 45].map((h, i) => (
                          <div
                            key={i}
                            className="rounded-md bg-primary/30"
                            style={{ height: `${h}px` }}
                            title={`D${i + 1}`}
                          />
                        ))}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{t("heroMock.weekStart")}</span>
                        <span>{t("heroMock.weekEnd")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <section className="py-14">
          <h2 className="text-2xl font-bold tracking-tight">
            {t("value.title")}
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Salad className="h-5 w-5" />
                </div>
                <CardTitle>{t("value.cards.fast.title")}</CardTitle>
                <CardDescription>{t("value.cards.fast.body")}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <CardTitle>{t("value.cards.pro.title")}</CardTitle>
                <CardDescription>{t("value.cards.pro.body")}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <CardTitle>{t("value.cards.calm.title")}</CardTitle>
                <CardDescription>{t("value.cards.calm.body")}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <Separator />

        <section id="how-it-works" className="py-14 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight">{t("how.title")}</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { n: "1", title: t("how.steps.oneTitle"), body: t("how.steps.oneBody") },
              { n: "2", title: t("how.steps.twoTitle"), body: t("how.steps.twoBody") },
              { n: "3", title: t("how.steps.threeTitle"), body: t("how.steps.threeBody") },
            ].map((s) => (
              <Card key={s.n} className="bg-card/60">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="w-fit">
                      {s.n}
                    </Badge>
                    <CardTitle className="text-base">{s.title}</CardTitle>
                  </div>
                  <CardDescription>{s.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section className="py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t("explore.title")}</h2>
              <p className="mt-2 text-muted-foreground">
                {t("explore.demoBody")}
              </p>
            </div>
            <Button onClick={() => navigate("/demo")} className="hidden sm:inline-flex">
              {t("explore.demoCta")}
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t("explore.demoTitle")}</CardTitle>
                  <PlayCircle className="h-5 w-5 text-primary" />
                </div>
                <CardDescription>{t("explore.demoBody")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <div className="text-[11px] text-muted-foreground">{t("explore.mock.exampleDay")}</div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-border bg-card p-3">
                      <div className="text-[11px] text-muted-foreground">{t("heroMock.meals.breakfast")}</div>
                      <div className="mt-2 text-sm font-semibold">300 kcal</div>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "40%" }} />
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <div className="text-[11px] text-muted-foreground">{t("heroMock.meals.lunch")}</div>
                      <div className="mt-2 text-sm font-semibold">510 kcal</div>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "68%" }} />
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <div className="text-[11px] text-muted-foreground">{t("heroMock.meals.dinner")}</div>
                      <div className="mt-2 text-sm font-semibold">210 kcal</div>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "28%" }} />
                      </div>
                    </div>
                  </div>
                </div>
                <Button onClick={() => navigate("/demo")} className="w-full">
                  {t("explore.demoCta")}
                </Button>
              </CardContent>
            </Card>

            <CalorieCalculator />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card/60">
              <CardHeader>
                <CardTitle className="text-base">{t("explore.galleryTitle")}</CardTitle>
                <CardDescription>{t("explore.galleryBody")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border bg-background/70 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/15">
                        <LayoutDashboard className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold leading-none">
                          {t("explore.galleryMock.patientTitle")}
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {t("explore.galleryMock.patientSubtitle")}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[11px]">
                      {t("heroMock.today")}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { label: t("explore.galleryMock.kcal"), value: "1,020" },
                      { label: t("explore.galleryMock.protein"), value: "78g" },
                      { label: t("explore.galleryMock.steps"), value: "6.2k" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg border border-border bg-card p-2">
                        <div className="text-[10px] text-muted-foreground">{m.label}</div>
                        <div className="mt-1 text-sm font-semibold">{m.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 space-y-2">
                    {[
                      {
                        key: "breakfast",
                        label: t("heroMock.meals.breakfast"),
                        items: [t("heroMock.items.oats"), t("heroMock.items.banana")],
                        width: "46%",
                      },
                      {
                        key: "lunch",
                        label: t("heroMock.meals.lunch"),
                        items: [t("heroMock.items.chicken"), t("heroMock.items.salad")],
                        width: "62%",
                      },
                    ].map((row) => (
                      <div key={row.key} className="rounded-lg border border-border bg-card p-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[11px] font-medium">{row.label}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {row.items.join(" · ")}
                          </div>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: row.width }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/70 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{t("explore.galleryMock.weekTitle")}</div>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-3 grid grid-cols-7 gap-1 items-end">
                    {[18, 26, 22, 30, 24, 28, 32].map((h, i) => (
                      <div key={i} className="rounded-md bg-primary/30" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{t("heroMock.weekStart")}</span>
                    <span>{t("heroMock.weekEnd")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/60">
              <CardHeader>
                <CardTitle className="text-base">{t("explore.nutritionistTitle")}</CardTitle>
                <CardDescription>{t("explore.nutritionistBody")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border bg-background/70 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/15">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold leading-none">
                          {t("explore.nutriMock.title")}
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {t("explore.nutriMock.subtitle")}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[11px]">
                      {t("explore.nutriMock.badge")}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2">
                    {[
                      { name: "Andrea M.", status: t("explore.nutriMock.statusOk"), note: t("explore.nutriMock.noteOk") },
                      { name: "Luis R.", status: t("explore.nutriMock.statusReview"), note: t("explore.nutriMock.noteReview") },
                      { name: "Sofía G.", status: t("explore.nutriMock.statusNew"), note: t("explore.nutriMock.noteNew") },
                    ].map((p) => (
                      <div key={p.name} className="rounded-lg border border-border bg-card p-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center text-xs font-semibold text-primary">
                              {p.name.split(" ").map((x) => x[0]).join("")}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{p.name}</div>
                              <div className="text-[11px] text-muted-foreground truncate">{p.note}</div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[11px] whitespace-nowrap">
                            {p.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/70 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{t("explore.nutriMock.adjustmentsTitle")}</div>
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    {[
                      t("explore.nutriMock.adjust1"),
                      t("explore.nutriMock.adjust2"),
                      t("explore.nutriMock.adjust3"),
                    ].map((a) => (
                      <div key={a} className="flex items-start gap-2 rounded-lg border border-border bg-card p-2">
                        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                        <div className="text-[13px] leading-relaxed">{a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/60">
              <CardHeader>
                <CardTitle className="text-base">{t("explore.videoTitle")}</CardTitle>
                <CardDescription>{t("explore.videoBody")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link to="/tour">
                    {t("explore.videoCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        <section className="py-14">
          <h2 className="text-2xl font-bold tracking-tight">{t("faq.title")}</h2>
          <div className="mt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>{t("faq.q1")}</AccordionTrigger>
                <AccordionContent>{t("faq.a1")}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>{t("faq.q2")}</AccordionTrigger>
                <AccordionContent>{t("faq.a2")}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>{t("faq.q3")}</AccordionTrigger>
                <AccordionContent>{t("faq.a3")}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        <section className="py-14">
          <Card className="bg-gradient-to-b from-primary/10 to-background">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">{t("finalCta.title")}</CardTitle>
              <CardDescription className="text-base">
                {t("finalCta.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={() => navigate("/demo")} className="h-11">
                {t("finalCta.primary")}
              </Button>
              <Button size="lg" variant="outline" asChild className="h-11">
                <Link to="/signup">{t("finalCta.secondary")}</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <footer className="py-10">
          <Separator />
          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {t("brand")}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link className="text-muted-foreground hover:text-foreground" to="/terms">
                {t("footer.terms")}
              </Link>
              <Link className="text-muted-foreground hover:text-foreground" to="/privacy">
                {t("footer.privacy")}
              </Link>
              <a className="text-muted-foreground hover:text-foreground" href="mailto:support@healthcore-lift.me">
                {t("footer.contact")}
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
