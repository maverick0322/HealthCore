import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Droplets,
  CalendarDays,
  TrendingDown,
  Flame,
  Plus,
  ChevronRight,
  Zap,
  UtensilsCrossed,
} from "lucide-react";
import { PatientNav } from "@/features/patient/components/PatientNav";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

// ── Dummy data ─────────────────────────────────────────────────────────────

const DUMMY = {
  calories: { consumed: 1420, goal: 2000 },
  macros: { protein: 98, carbs: 160, fat: 52 },
  macroGoals: { protein: 130, carbs: 200, fat: 65 },
  weight: { current: 78.5, start: 83, target: 72 },
  weightHistory: [83, 82.1, 81.4, 80.7, 79.9, 79.2, 78.5],
  water: { consumed: 5, goal: 8 },
  appointment: {
    date: "Vie 30 May, 10:00 AM",
    nutritionist: "Dra. Elena Martínez",
  },
  meals: [
    { key: "breakfast", name: "Desayuno", items: "Avena + plátano + leche", kcal: 380 },
    { key: "lunch", name: "Comida", items: "Pollo a la plancha + arroz + ensalada", kcal: 620 },
    { key: "dinner", name: "Cena", items: "Sopa de verduras + pan integral", kcal: 320 },
    { key: "snack", name: "Snack", items: "Almendras + manzana", kcal: 180 },
  ],
  streak: 7,
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Thin arc SVG calorie ring */
function CalorieRing({
  consumed,
  goal,
}: {
  consumed: number;
  goal: number;
}) {
  const pct = Math.min(consumed / goal, 1);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-[-90deg]">
      {/* track */}
      <circle cx="70" cy="70" r={r} fill="none" strokeWidth="12" className="stroke-muted" />
      {/* progress */}
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        className="stroke-primary transition-all duration-700"
      />
    </svg>
  );
}

/** Macro progress bar */
function MacroBar({
  label,
  value,
  goal,
  color,
  unit = "g",
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit?: string;
}) {
  const pct = Math.min((value / goal) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value}
          {unit} / {goal}
          {unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Water glass pill */
function WaterGlass({ filled }: { filled: boolean }) {
  return (
    <Droplets
      size={22}
      className={`transition-colors duration-300 ${
        filled ? "text-sky-400" : "text-muted-foreground/30"
      }`}
    />
  );
}

// ── (nav extracted to PatientNav component) ────────────────────────────────

// ── Component ──────────────────────────────────────────────────────────────

/**
 * PatientDashboardPage
 *
 * Presentation-only dashboard for the PATIENT role.
 * All data is hardcoded dummy content — service integration is a future sprint.
 */
export const PatientDashboardPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("patient");
  const user = useAuthStore((s) => s.user);

  const displayName = user?.email?.split("@")[0] ?? "Usuario";
  const remaining = DUMMY.calories.goal - DUMMY.calories.consumed;
  const calPct = Math.round((DUMMY.calories.consumed / DUMMY.calories.goal) * 100);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      {/* ── Responsive Nav (sidebar desktop / bottom bar mobile) ── */}
      <PatientNav />

      {/* ── Top Controls ─────────────────────────────────────────── */}
      <div className="md:pl-56">
      <SettingsBar />
      </div>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t("dashboard.greeting", { name: displayName })}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("dashboard.greetingSubtitle")}
            </p>
          </div>
          {/* Streak badge */}
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-full">
            <Zap size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {t("dashboard.streakDays", { count: DUMMY.streak })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-20 md:pb-6 md:pl-56 animate-in fade-in slide-in-from-bottom-2 duration-500">

        {/* ── Calories + Macros ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Calorie ring card */}
          <Card id="card-calories">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Flame size={16} className="text-primary" />
                {t("dashboard.caloriesCard")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-4 pb-5">
              <div className="relative flex items-center justify-center">
                <CalorieRing
                  consumed={DUMMY.calories.consumed}
                  goal={DUMMY.calories.goal}
                />
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold leading-none">
                    {DUMMY.calories.consumed}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("dashboard.kcal")}
                  </span>
                </div>
              </div>
              <div className="flex justify-around w-full mt-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">{t("dashboard.goal")}</p>
                  <p className="font-semibold text-sm">{DUMMY.calories.goal}</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("dashboard.remaining")}</p>
                  <p className={`font-semibold text-sm ${remaining < 0 ? "text-destructive" : "text-emerald-500"}`}>
                    {remaining}
                  </p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground">%</p>
                  <p className="font-semibold text-sm">{calPct}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Macros card */}
          <Card id="card-macros">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold">
                {t("dashboard.macros")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <MacroBar
                label={t("dashboard.protein")}
                value={DUMMY.macros.protein}
                goal={DUMMY.macroGoals.protein}
                color="bg-primary"
              />
              <MacroBar
                label={t("dashboard.carbs")}
                value={DUMMY.macros.carbs}
                goal={DUMMY.macroGoals.carbs}
                color="bg-amber-400"
              />
              <MacroBar
                label={t("dashboard.fat")}
                value={DUMMY.macros.fat}
                goal={DUMMY.macroGoals.fat}
                color="bg-sky-400"
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Weight Evolution ───────────────────────────────────── */}
        <Card id="card-weight">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingDown size={16} className="text-primary" />
              {t("dashboard.weightEvolution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mini sparkline */}
            <div className="flex items-end gap-1.5 h-16 mb-4">
              {DUMMY.weightHistory.map((w, i) => {
                const minW = Math.min(...DUMMY.weightHistory);
                const maxW = Math.max(...DUMMY.weightHistory);
                const heightPct = maxW === minW ? 50 : ((w - minW) / (maxW - minW)) * 100;
                const barH = Math.max(8, (1 - heightPct / 100) * 60 + 8);
                const isLast = i === DUMMY.weightHistory.length - 1;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm transition-all duration-500 ${
                      isLast ? "bg-primary" : "bg-primary/30"
                    }`}
                    style={{ height: `${barH}px` }}
                    title={`${w} kg`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-sm">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{t("dashboard.startWeight")}</p>
                <p className="font-bold">{DUMMY.weight.start} kg</p>
              </div>
              <div className="space-y-0.5 text-center">
                <p className="text-xs text-muted-foreground">{t("dashboard.currentWeight")}</p>
                <p className="font-bold text-primary">{DUMMY.weight.current} kg</p>
              </div>
              <div className="space-y-0.5 text-right">
                <p className="text-xs text-muted-foreground">{t("dashboard.targetWeight")}</p>
                <p className="font-bold">{DUMMY.weight.target} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Bottom row: Appointment + Water ───────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Next appointment */}
          <Card id="card-appointment">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarDays size={16} className="text-primary" />
                {t("dashboard.nextAppointment")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-primary/8 rounded-xl p-4 space-y-1">
                <p className="font-semibold text-sm leading-snug">
                  {DUMMY.appointment.date}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.withNutritionist")} {DUMMY.appointment.nutritionist}
                </p>
              </div>
              <Button
                id="btn-schedule-appointment"
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs"
                onClick={() => navigate("/appointments/patient")}
              >
                <Plus size={13} />
                {t("dashboard.scheduleAppointment")}
              </Button>
            </CardContent>
          </Card>

          {/* Water tracker */}
          <Card id="card-water">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Droplets size={16} className="text-primary" />
                {t("dashboard.water")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: DUMMY.water.goal }).map((_, i) => (
                  <WaterGlass key={i} filled={i < DUMMY.water.consumed} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {DUMMY.water.consumed} / {DUMMY.water.goal}{" "}
                {t("dashboard.glasses")}
              </p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all duration-700"
                  style={{
                    width: `${(DUMMY.water.consumed / DUMMY.water.goal) * 100}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Today's meal log ───────────────────────────────────── */}
        <Card id="card-meal-log">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UtensilsCrossed size={16} className="text-primary" />
                {t("dashboard.todayLog")}
              </CardTitle>
              <button
                id="btn-view-all-meals"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
                disabled
              >
                {t("dashboard.viewAll")}
                <ChevronRight size={13} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pb-3">
            {DUMMY.meals.map((meal) => (
              <div
                key={meal.key}
                className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{meal.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{meal.items}</p>
                </div>
                <span className="text-sm font-semibold text-primary ml-4 flex-shrink-0">
                  {meal.kcal} {t("dashboard.kcal")}
                </span>
              </div>
            ))}
            <Button
              id="btn-add-food"
              className="w-full mt-3 gap-2"
              size="sm"
              disabled
            >
              <Plus size={14} />
              {t("dashboard.addFood")}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
