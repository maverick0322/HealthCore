import { useState } from "react";
import { useTranslation } from "react-i18next";

import { SettingsBar } from "@/shared/components/SettingsBar";
import { PatientNav } from "@/features/patient/components/PatientNav";
import { PatientHistoryOverviewSection } from "@/features/patient/components/PatientHistoryOverviewSection";
import { useDailyLogs } from "@/features/tracking/hooks/useDailyLogs";

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
        <PatientHistoryOverviewSection
          logs={logs}
          isLogsLoading={isLoading}
          logsError={error}
          selectedDateLabel={selectedDate === todayStr ? t("history.today") : selectedDate}
          onPreviousDay={() => changeDate(-1)}
          onNextDay={() => changeDate(1)}
          disableNextDay={selectedDate === todayStr}
        />
      </main>
    </div>
  );
};
