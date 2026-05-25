import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  TrendingDown,
  Flame,
  PieChart,
  Target,
  Award,
  Loader2
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { PatientNav } from "@/features/patient/components/PatientNav";

import { PatientHistoryOverviewSection } from "@/features/patient/components/PatientHistoryOverviewSection";

import { useDailyLogs } from "@/features/tracking/hooks/useDailyLogs";
import { useHistoricalMacros } from "@/features/tracking/hooks/useHistoricalMacros";
import { trackingService } from "@/features/tracking/services/trackingService";

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
  caloriesGoal: 2000, 
  adherenceRate: 85,
  totalDays: 45,
};

function MacroDonut({ p, c, f }: { p: number; c: number; f: number }) {
  const r = 50;
  const circ = 2 * Math.PI * r;

  const pDash = (p / 100) * circ;
  const cDash = (c / 100) * circ;
  const fDash = (f / 100) * circ;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="rotate-[-90deg]">
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="16" className="stroke-primary" strokeDasharray={`${pDash} ${circ}`} strokeDashoffset={0} />
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="16" className="stroke-amber-400" strokeDasharray={`${cDash} ${circ}`} strokeDashoffset={-pDash} />
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="16" className="stroke-sky-400" strokeDasharray={`${fDash} ${circ}`} strokeDashoffset={-(pDash + cDash)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Macros</span>
      </div>
    </div>
  );
}

export const PatientHistoryPage = () => {
  const { t } = useTranslation("patient");

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);

  const { 
    caloriesHistory, 
    caloriesAvg, 
    macrosAvg, 
    isLoading: isHistoryLoading 
  } = useHistoricalMacros();

  const { logs, isLoading: isTimelineLoading, error: timelineError } = useDailyLogs(selectedDate);

  useEffect(() => {
    trackingService.getTodaySummary()
      .then(setDashboardSummary)
      .catch(console.error);
  }, []);

  const changeDate = (offsetDays: number) => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const weightLost = HISTORY_DUMMY.weightStart - HISTORY_DUMMY.weightCurrent;
  const weightRemaining = HISTORY_DUMMY.weightCurrent - HISTORY_DUMMY.weightTarget;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <PatientNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="relative overflow-hidden border-b border-border bg-primary/10 md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-20 sm:px-6">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {t("history.title", "Historial Nutricional")}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("history.subtitle", "Tu evolución y registros detallados")}
          </p>
        </div>
      </div>

      <main className="animate-in slide-in-from-bottom-2 fade-in mx-auto flex-1 w-full max-w-7xl space-y-5 px-4 py-6 pb-20 duration-500 sm:px-6 md:pl-56 md:pb-8">

        <div className="grid grid-cols-2 gap-3">
          {/* Adherencia - Equipo Clinical */}
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
          
          {/* Racha - Equipo Tracking */}
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-amber-500">
                <Award size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">{t("history.streak")}</span>
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {dashboardSummary ? t("history.streakDays", { count: dashboardSummary.currentStreak ?? 0 }) : <Loader2 className="animate-spin w-5 h-5" />}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("history.bestStreak")}: {dashboardSummary?.bestStreak || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Evolución de Peso - Equipo Clinical */}
        <Card id="card-history-weight">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingDown size={16} className="text-primary" />
              Evolución de Peso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-32 flex items-end justify-between gap-1 pt-4 pb-2 border-b border-border/50">
              {HISTORY_DUMMY.weightHistory.map((pt, i) => {
                const min = 75; 
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

        {/* Calorías y Macros - Equipo Tracking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card id="card-history-calories">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Flame size={16} className="text-primary" />
                Tendencia Calórica (7 días)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isHistoryLoading ? (
                <div className="h-24 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : (
                <>
                  <div className="flex justify-between items-baseline mb-4">
                    <div>
                      <p className="text-2xl font-bold">{caloriesAvg}</p>
                      <p className="text-xs text-muted-foreground">Promedio diario</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{HISTORY_DUMMY.caloriesGoal}</p>
                      <p className="text-xs text-muted-foreground">Meta</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-12">
                    {caloriesHistory.map((c, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-amber-500/40 rounded-t-sm transition-colors hover:bg-amber-500"
                        style={{ height: `${Math.min((c / HISTORY_DUMMY.caloriesGoal) * 100, 100)}%` }}
                        title={`${Math.round(c)} kcal`}
                      />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card id="card-history-macros">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PieChart size={16} className="text-primary" />
                Distribución de Macros (7 días)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4 pt-4">
              {isHistoryLoading ? (
                <div className="h-32 w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : (
                <>
                  <MacroDonut
                    p={macrosAvg.protein}
                    c={macrosAvg.carbs}
                    f={macrosAvg.fat}
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between text-xs items-center">
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary" />{t("history.protein")}</div>
                      <span className="font-semibold">{macrosAvg.protein}%</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" />{t("history.carbs")}</div>
                      <span className="font-semibold">{macrosAvg.carbs}%</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-sky-400" />{t("history.fat")}</div>
                      <span className="font-semibold">{macrosAvg.fat}%</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sección de Timeline refactorizada (Rama main) */}
        <PatientHistoryOverviewSection
          logs={logs}
          isLogsLoading={isTimelineLoading}
          logsError={timelineError}
          selectedDateLabel={selectedDate === todayStr ? t("history.today", "Hoy") : selectedDate}
          onPreviousDay={() => changeDate(-1)}
          onNextDay={() => changeDate(1)}
          disableNextDay={selectedDate === todayStr}
        />

      </main>
    </div>
  );
};