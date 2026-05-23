import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  AlertCircle,
  CalendarX,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Users,
} from "lucide-react";

import { clinicalApi } from "@/features/clinical/services/clinicalService";
import type { NutritionistPatientProfileResponse } from "@/features/clinical/types/clinical.types";
import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { nutritionistAgendaService } from "@/features/nutritionist/services/nutritionistAgendaService";
import type { AppointmentResponse, AvailabilitySlotResponse } from "@/features/nutritionist/types/agenda.types";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";

const REPORT_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "ATTENDED"];

const buildDefaultRange = () => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
};

const getPatientName = (patient: NutritionistPatientProfileResponse) =>
  patient.fullName?.trim() || patient.userId;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

export const NutritionistReportsPage = () => {
  const { t } = useTranslation("nutritionist");
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<NutritionistPatientProfileResponse[]>([]);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlotResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [range] = useState(buildDefaultRange);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const [patientResponse, appointmentResponse, slotResponse] = await Promise.all([
          clinicalApi.getNutritionistPatients(),
          nutritionistAgendaService.getAppointmentReport(range.from, range.to, REPORT_STATUSES),
          nutritionistAgendaService.getSlotReport(range.from, range.to, "inactive"),
        ]);
        setPatients(patientResponse);
        setAppointments(appointmentResponse);
        setSlots(slotResponse);
      } catch (error) {
        console.error("Error loading nutritionist reports:", error);
        setLoadError(t("reports.error"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadReports();
  }, [range.from, range.to, t]);

  const reportData = useMemo(
    () => ({
      activePatients: patients.length,
      consultations: appointments.filter((appointment) => appointment.status === "ATTENDED").length,
      cancelledAppointments: appointments.filter((appointment) => appointment.status === "CANCELLED").length,
      deactivatedSlots: slots.length,
    }),
    [appointments, patients.length, slots.length]
  );

  const patientRows = useMemo(() => {
    return patients
      .map((patient) => {
        const patientAppointments = appointments.filter((appointment) => appointment.patientId === patient.userId);
        const active = patientAppointments.filter((appointment) =>
          appointment.status === "PENDING" || appointment.status === "CONFIRMED"
        ).length;
        const attended = patientAppointments.filter((appointment) => appointment.status === "ATTENDED").length;
        const cancelled = patientAppointments.filter((appointment) => appointment.status === "CANCELLED").length;
        const latestAppointment = [...patientAppointments].sort(
          (left, right) => new Date(right.startTime).getTime() - new Date(left.startTime).getTime()
        )[0];

        return {
          id: patient.userId,
          name: getPatientName(patient),
          active,
          attended,
          cancelled,
          lastActivity: latestAppointment?.startTime ?? null,
        };
      })
      .filter((patient) => patient.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [appointments, patients, searchTerm]);

  const renderReportRows = () => {
    if (isLoading) {
      return (
        <div className="p-10 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="p-10 text-center text-muted-foreground">
          <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{loadError}</p>
        </div>
      );
    }

    if (patientRows.length === 0) {
      return (
        <div className="p-10 text-center text-muted-foreground">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t("reports.empty")}</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-border/50">
        {patientRows.map((patient) => (
          <div
            key={patient.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{patient.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {patient.lastActivity
                    ? t("reports.lastActivity", { date: formatDate(patient.lastActivity) })
                    : t("patients.lastVisitPlaceholder")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("reports.appointmentsSummary", {
                    active: patient.active,
                    attended: patient.attended,
                    cancelled: patient.cancelled,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 w-full sm:w-auto">
                <FileText size={14} />
                {t("reports.downloadPdf")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 w-full sm:w-auto text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-border"
              >
                <FileSpreadsheet size={14} />
                {t("reports.downloadCsv")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <NutritionistNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t("reports.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("reports.subtitle")}
          </p>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary">
                {t("reports.activePatients")}
              </CardTitle>
              <Users size={16} className="text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{reportData.activePatients}</div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {t("reports.consultations")}
              </CardTitle>
              <Activity size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {reportData.consultations}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-rose-500/5 border-rose-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">
                {t("reports.cancelledAppointments")}
              </CardTitle>
              <CalendarX size={16} className="text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                {reportData.cancelledAppointments}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {t("reports.deactivatedSlots")}
              </CardTitle>
              <FileText size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {reportData.deactivatedSlots}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Download size={18} className="text-primary" />
                  {t("reports.exportTitle")}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {t("reports.exportDesc")}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-muted-foreground" />
                </div>
                <input
                  type="text"
                  placeholder={t("reports.searchPlaceholder")}
                  className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 ring-primary transition-all"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {renderReportRows()}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
