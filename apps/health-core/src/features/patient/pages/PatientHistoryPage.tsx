import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Flame,
  PieChart,
  Target,
  Award,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { PatientNav } from "@/features/patient/components/PatientNav";
import { Button } from "@/shared/ui/button";
import { WeightHistorySection } from "@/features/patient/components/WeightHistorySection";

import { useDailyLogs } from "@/features/tracking/hooks/useDailyLogs";
import { DetailedMealTimeline } from "@/features/tracking/components/DetailedMealTimeline";

const HISTORY_DUMMY = {
  caloriesAvg: 1650,
  caloriesGoal: 2000,
  caloriesHistory: [1800, 1950, 1600, 1500, 1650, 1700, 1420],
  adherenceRate: 85,
  streakCurrent: 7,
  streakBest: 21,
  totalDays: 45,
  macrosAvg: { protein: 30, carbs: 45, fat: 25 },
};

function MacroDonut({ p, c, f }: { p: number; c: number; f: number }) {
  const r = 50;
  const circ = 2 * Math.PI * r;

  const pDash = (p / 100) * circ;
  const cDash = (c / 100) * circ;
  const fDash = (f / 100) * circ;

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="rotate-[-90deg]">
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="16" className="stroke-primary" strokeDasharray={`${pDash} ${circ}`} strokeDashoffset={0} />
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="16" className="stroke-amber-400" strokeDasharray={`${cDash} ${circ}`} strokeDashoffset={-pDash} />
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="16" className="stroke-sky-400" strokeDasharray={`${fDash} ${circ}`} strokeDashoffset={-(pDash + cDash)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Macros</span>
      </div>
    </div>
  );
}

export const PatientHistoryPage = () => {
  const { t } = useTranslation("patient");

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const { logs, isLoading, error } = useDailyLogs(selectedDate);

  const changeDate = (offsetDays: number) => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

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
            {t("history.title")}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("history.subtitle")}
          </p>
        </div>
      </div>

      <main className="animate-in slide-in-from-bottom-2 fade-in mx-auto flex-1 w-full max-w-7xl space-y-5 px-4 py-6 pb-20 duration-500 sm:px-6 md:pl-56 md:pb-8">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-1 p-4">
              <div className="flex items-center gap-2 text-primary">
                <Target size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">{t("history.adherence")}</span>
              </div>
              <p className="text-2xl font-bold">{HISTORY_DUMMY.adherenceRate}%</p>
              <p className="text-xs text-muted-foreground">{t("history.totalDaysTracked")}: {HISTORY_DUMMY.totalDays}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="flex flex-col gap-1 p-4">
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

        <WeightHistorySection />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card id="card-history-calories">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Flame size={16} className="text-primary" />
                {t("history.calorieTrend")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-baseline justify-between">
                <div>
                  <p className="text-2xl font-bold">{HISTORY_DUMMY.caloriesAvg}</p>
                  <p className="text-xs text-muted-foreground">{t("history.calorieAvg")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{HISTORY_DUMMY.caloriesGoal}</p>
                  <p className="text-xs text-muted-foreground">{t("history.calorieGoal")}</p>
                </div>
              </div>
              <div className="flex h-12 items-end gap-1">
                {HISTORY_DUMMY.caloriesHistory.map((calories, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-sm bg-amber-500/40 transition-colors hover:bg-amber-500"
                    style={{ height: `${(calories / 2500) * 100}%` }}
                    title={`${calories} kcal`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card id="card-history-macros">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
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
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-primary" />{t("history.protein")}</div>
                  <span className="font-semibold">{HISTORY_DUMMY.macrosAvg.protein}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-amber-400" />{t("history.carbs")}</div>
                  <span className="font-semibold">{HISTORY_DUMMY.macrosAvg.carbs}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-sky-400" />{t("history.fat")}</div>
                  <span className="font-semibold">{HISTORY_DUMMY.macrosAvg.fat}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 border-t border-border/50 pt-4">
          <div className="mb-4 flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-2">
            <Button variant="ghost" size="sm" onClick={() => changeDate(-1)} className="gap-1 hover:bg-background">
              <ChevronLeft size={16} /> {t("history.previousDay")}
            </Button>

            <div className="flex items-center gap-2 font-medium">
              <CalendarIcon size={16} className="text-primary" />
              {selectedDate === todayStr ? t("history.today") : selectedDate}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => changeDate(1)}
              disabled={selectedDate === todayStr}
              className="gap-1 hover:bg-background"
            >
              {t("history.nextDay")} <ChevronRight size={16} />
            </Button>
          </div>

          <DetailedMealTimeline logs={logs} isLoading={isLoading} error={error} />
        </div>
      </main>
    </div>
  );
};
