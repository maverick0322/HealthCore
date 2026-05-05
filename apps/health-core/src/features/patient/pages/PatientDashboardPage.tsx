import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Droplets,
  CalendarDays,
  Plus,
  ChevronRight,
  Zap,
  UtensilsCrossed,
} from "lucide-react";
import { PatientNav } from "@/features/patient/components/PatientNav";
import { WeightChart } from "@/features/patient/components/WeightChart";
import { HealthGoalsCard } from "@/features/patient/components/HealthGoalsCard";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

// ── Dummy data ─────────────────────────────────────────────────────────────

const DUMMY = {
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex items-start sm:items-center justify-between">
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

        <HealthGoalsCard />

        {/* ── Weight Evolution ───────────────────────────────────── */}
        <WeightChart />

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
              onClick={() => navigate("/tracking/log-food")}
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
