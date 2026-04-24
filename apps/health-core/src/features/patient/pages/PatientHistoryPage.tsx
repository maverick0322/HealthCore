import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  TrendingDown,
  Flame,
  PieChart,
  Target,
  Calendar,
  UtensilsCrossed,
  Award,
  CalendarDays,
  ListFilter,
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { PatientNav } from "@/features/patient/components/PatientNav";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { usePatientOnboardingStore } from "@/features/onboarding/store/usePatientOnboardingStore";

// ── Dummy data ─────────────────────────────────────────────────────────────

const HISTORY_DUMMY = {
  weightStart: 83.0,
  weightCurrent: 78.5,
  weightTarget: 72.0,
  weightHistory: [
    { date: "Oct", w: 83.0 },
    { date: "Nov", w: 82.1 },
    { date: "Dic", w: 81.4 },
    { date: "Ene", w: 80.7 },
    { date: "Feb", w: 79.9 },
    { date: "Mar", w: 79.2 },
    { date: "Abr", w: 78.5 },
  ],
  caloriesAvg: 1650,
  caloriesGoal: 2000,
  caloriesHistory: [1800, 1950, 1600, 1500, 1650, 1700, 1420],
  adherenceRate: 85,
  streakCurrent: 7,
  streakBest: 21,
  totalDays: 45,
  macrosAvg: { protein: 30, carbs: 45, fat: 25 },
  mealLog: [
    { id: "1", date: "Hoy, 14:30", type: "lunch", name: "Pollo a la plancha", kcal: 620, p: 45, c: 50, f: 12 },
    { id: "2", date: "Hoy, 09:00", type: "breakfast", name: "Avena y plátano", kcal: 380, p: 12, c: 60, f: 8 },
    { id: "3", date: "Ayer, 20:00", type: "dinner", name: "Sopa de verduras", kcal: 320, p: 15, c: 40, f: 10 },
    { id: "4", date: "Ayer, 14:00", type: "lunch", name: "Ensalada César", kcal: 550, p: 35, c: 20, f: 30 },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Simple SVG Donut Chart for Macro Distribution */
function MacroDonut({ p, c, f }: { p: number; c: number; f: number }) {
  const r = 50;
  const circ = 2 * Math.PI * r;
  
  // Calculate stroke-dasharrays based on percentages
  const pDash = (p / 100) * circ;
  const cDash = (c / 100) * circ;
  const fDash = (f / 100) * circ;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="rotate-[-90deg]">
        {/* Protein */}
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="16" className="stroke-primary" strokeDasharray={`${pDash} ${circ}`} strokeDashoffset={0} />
        {/* Carbs */}
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="16" className="stroke-amber-400" strokeDasharray={`${cDash} ${circ}`} strokeDashoffset={-pDash} />
        {/* Fat */}
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="16" className="stroke-sky-400" strokeDasharray={`${fDash} ${circ}`} strokeDashoffset={-(pDash + cDash)} />
      </svg>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Macros</span>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * PatientHistoryPage
 *
 * Detailed view of patient progress, weight evolution, caloric trends, and meal logs.
 * All data is hardcoded dummy content for the current UI presentation sprint.
 */
export const PatientHistoryPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("patient");
  const user = useAuthStore((s) => s.user);

  const weightLost = HISTORY_DUMMY.weightStart - HISTORY_DUMMY.weightCurrent;
  const weightRemaining = HISTORY_DUMMY.weightCurrent - HISTORY_DUMMY.weightTarget;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <PatientNav />

      {/* ── Top Controls ───────────────────────────────────────── */}
      <div className="md:pl-56">
        <SettingsBar />
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t("history.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("history.subtitle")}
          </p>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-20 md:pb-8 md:pl-56 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* Adherence & Streak Row */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-primary">
                <Target size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">{t("history.adherence")}</span>
              </div>
              <p className="text-2xl font-bold">{HISTORY_DUMMY.adherenceRate}%</p>
              <p className="text-xs text-muted-foreground">{t("history.totalDaysTracked")}: {HISTORY_DUMMY.totalDays}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-amber-500">
                <Award size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">{t("history.streak")}</span>
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {t("history.streakDays", { count: HISTORY_DUMMY.streakCurrent })}
              </p>
              <p className="text-xs text-muted-foreground">{t("history.bestStreak")}: {HISTORY_DUMMY.streakBest}</p>
            </CardContent>
          </Card>
        </div>

        {/* Weight Evolution */}
        <Card id="card-history-weight">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingDown size={16} className="text-primary" />
              {t("history.weightEvolution")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chart mock */}
            <div className="h-32 flex items-end justify-between gap-1 pt-4 pb-2 border-b border-border/50">
              {HISTORY_DUMMY.weightHistory.map((pt, i) => {
                const min = 75; // chart visual baseline
                const max = 85;
                const pct = ((pt.w - min) / (max - min)) * 100;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="w-full max-w-[24px] bg-primary/20 rounded-t-sm relative group-hover:bg-primary transition-colors" style={{ height: `${pct}%` }}>
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-background shadow-sm border px-1 rounded">
                        {pt.w}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase">{pt.date}</span>
                  </div>
                );
              })}
            </div>
            {/* Stats row */}
            <div className="flex justify-between text-sm pt-2">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("history.weightLost")}</p>
                <p className="font-bold text-emerald-500">-{weightLost.toFixed(1)} kg</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("dashboard.currentWeight")}</p>
                <p className="font-bold">{HISTORY_DUMMY.weightCurrent} kg</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("history.weightRemaining")}</p>
                <p className="font-bold text-amber-500">{weightRemaining.toFixed(1)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nutrition: Calories & Macros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card id="card-history-calories">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Flame size={16} className="text-primary" />
                {t("history.calorieTrend")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-baseline mb-4">
                <div>
                  <p className="text-2xl font-bold">{HISTORY_DUMMY.caloriesAvg}</p>
                  <p className="text-xs text-muted-foreground">{t("history.calorieAvg")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{HISTORY_DUMMY.caloriesGoal}</p>
                  <p className="text-xs text-muted-foreground">{t("history.calorieGoal")}</p>
                </div>
              </div>
              {/* Mini sparkline for calories */}
              <div className="flex items-end gap-1 h-12">
                {HISTORY_DUMMY.caloriesHistory.map((c, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-amber-500/40 rounded-t-sm transition-colors hover:bg-amber-500"
                    style={{ height: `${(c / 2500) * 100}%` }}
                    title={`${c} kcal`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card id="card-history-macros">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PieChart size={16} className="text-primary" />
                {t("history.macroBreakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4 pt-4">
              <MacroDonut
                p={HISTORY_DUMMY.macrosAvg.protein}
                c={HISTORY_DUMMY.macrosAvg.carbs}
                f={HISTORY_DUMMY.macrosAvg.fat}
              />
              <div className="flex-1 space-y-3">
                <div className="flex justify-between text-xs items-center">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary" />{t("history.protein")}</div>
                  <span className="font-semibold">{HISTORY_DUMMY.macrosAvg.protein}%</span>
                </div>
                <div className="flex justify-between text-xs items-center">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" />{t("history.carbs")}</div>
                  <span className="font-semibold">{HISTORY_DUMMY.macrosAvg.carbs}%</span>
                </div>
                <div className="flex justify-between text-xs items-center">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-sky-400" />{t("history.fat")}</div>
                  <span className="font-semibold">{HISTORY_DUMMY.macrosAvg.fat}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Meal Log */}
        <Card id="card-history-log">
          <CardHeader className="pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarDays size={16} className="text-primary" />
                {t("history.mealLog")}
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ListFilter size={14} />
                {t("history.filterAll")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {HISTORY_DUMMY.mealLog.map((meal) => (
                <div key={meal.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-sm">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">{meal.date} • {t(`history.filter${meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}`)}</p>
                    </div>
                    <span className="text-primary font-bold text-sm bg-primary/10 px-2 py-0.5 rounded-md">
                      {meal.kcal} {t("history.calories").toLowerCase()}
                    </span>
                  </div>
                  <div className="flex gap-4 text-[11px] text-muted-foreground">
                    <span><strong className="text-foreground">{meal.p}g</strong> {t("history.protein")}</span>
                    <span><strong className="text-foreground">{meal.c}g</strong> {t("history.carbs")}</span>
                    <span><strong className="text-foreground">{meal.f}g</strong> {t("history.fat")}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
};
