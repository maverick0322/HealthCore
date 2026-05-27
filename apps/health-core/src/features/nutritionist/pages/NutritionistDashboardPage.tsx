import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock,
  Loader2,
  Users,
} from "lucide-react";

import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { clinicalApi } from "@/features/clinical/services/clinicalService";
import type { NutritionistPatientProfileResponse } from "@/features/clinical/types/clinical.types";
import { useNutritionistAppointments } from "@/features/nutritionist/hooks/useNutritionistAppointments";
import { formatPatientGoalLabel } from "@/features/onboarding/utils/profilePresentation";
import {
  addDays,
  formatLocalDate,
  formatLocalTime,
  getDateRangeForDateKeys,
  localDateKeyFromIso,
  todayDateKey,
} from "@/features/agenda/utils/agendaDateUtils";

const getFirstName = (name: string | null | undefined) =>
  name?.trim().split(/\s+/)[0] ?? null;

const statusClass = (status: string) => {
  switch (status) {
    case "CONFIRMED":
    case "ATTENDED":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
    case "PENDING":
      return "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
};

export const NutritionistDashboardPage = () => {
  const { t } = useTranslation(["nutritionist", "onboarding"]);
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [patients, setPatients] = useState<NutritionistPatientProfileResponse[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState<string | null>(null);

  const {
    appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    fetchAppointments,
  } = useNutritionistAppointments();

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      try {
        const profile = await clinicalApi.getMyNutritionistProfile();
        if (!ignore) {
          setDisplayName(getFirstName(profile.fullName) ?? t("dashboard.defaultName"));
        }
      } catch {
        if (!ignore) {
          setDisplayName(t("dashboard.defaultName"));
        }
      }
    };

    const loadPatients = async () => {
      setPatientsLoading(true);
      setPatientsError(null);
      try {
        const linkedPatients = await clinicalApi.getNutritionistPatients();
        if (!ignore) {
          setPatients(linkedPatients);
        }
      } catch {
        if (!ignore) {
          setPatients([]);
          setPatientsError(t("patients.error"));
        }
      } finally {
        if (!ignore) {
          setPatientsLoading(false);
        }
      }
    };

    void loadProfile();
    void loadPatients();

    return () => {
      ignore = true;
    };
  }, [t]);

  useEffect(() => {
    const today = todayDateKey();
    const range = getDateRangeForDateKeys(today, addDays(today, 14));
    void fetchAppointments(range.from, range.to);
  }, [fetchAppointments]);

  const patientNameById = useMemo(
    () =>
      new Map(
        patients.map((patient) => [
          patient.userId,
          patient.fullName?.trim() || t("dashboard.unknownPatient"),
        ]),
      ),
    [patients, t],
  );

  const upcomingAppointments = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((appointment) => appointment.status !== "CANCELLED")
      .filter((appointment) => new Date(appointment.endTime).getTime() >= now)
      .sort(
        (left, right) =>
          new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
      );
  }, [appointments]);

  const today = todayDateKey();
  const appointmentsToday = appointments.filter(
    (appointment) =>
      appointment.status !== "CANCELLED" &&
      localDateKeyFromIso(appointment.startTime) === today,
  ).length;
  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status === "PENDING",
  ).length;
  const patientPreview = patients.slice(0, 5);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <NutritionistNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="border-b border-border bg-primary/10 md:pl-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t("dashboard.greeting", { name: displayName ?? t("dashboard.defaultName") })}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("dashboard.greetingSubtitle")}
          </p>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.activePatients")}
              </CardTitle>
              <Users size={16} className="text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {patientsLoading ? <Loader2 size={20} className="animate-spin" /> : patients.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.appointmentsToday")}
              </CardTitle>
              <CalendarDays size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointmentsLoading ? <Loader2 size={20} className="animate-spin" /> : appointmentsToday}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.pendingAppointments")}
              </CardTitle>
              <ClipboardList size={16} className="text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointmentsLoading ? <Loader2 size={20} className="animate-spin" /> : pendingAppointments}
              </div>
            </CardContent>
          </Card>
        </div>

        {(patientsError || appointmentsError) && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-3 text-sm text-destructive">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{patientsError ?? appointmentsError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
          <Card className="shadow-sm border-border/50 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20 pb-4 border-b border-border/50">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CalendarDays size={18} className="text-primary" />
                  {t("dashboard.nextAppointments")}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {t("dashboard.agendaSubtitle")}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary -mr-2"
                onClick={() => navigate("/agenda/nutritionist")}
              >
                {t("dashboard.viewAll")} <ChevronRight size={14} className="ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {appointmentsLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" />
                  {t("dashboard.loadingAppointments")}
                </div>
              ) : upcomingAppointments.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {upcomingAppointments.slice(0, 5).map((appointment) => {
                    const patientName =
                      patientNameById.get(appointment.patientId) ??
                      t("dashboard.unknownPatient");

                    return (
                      <button
                        key={appointment.id}
                        type="button"
                        className="w-full p-4 text-left hover:bg-muted/20 transition-colors"
                        onClick={() =>
                          navigate(`/patients/nutritionist/${encodeURIComponent(appointment.patientId)}`)
                        }
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-14 h-14 rounded-lg bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0">
                              <Clock size={14} className="text-primary mb-0.5" />
                              <span className="text-xs font-bold text-primary">
                                {formatLocalTime(appointment.startTime)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{patientName}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatLocalDate(appointment.startTime)},{" "}
                                {formatLocalTime(appointment.startTime)} -{" "}
                                {formatLocalTime(appointment.endTime)}
                              </p>
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusClass(appointment.status)}`}>
                            {t(`agenda.status.${appointment.status}`)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <CalendarDays size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{t("dashboard.noAppointments")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users size={18} className="text-primary" />
                {t("dashboard.activePatients")}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {t("dashboard.patientsSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {patientsLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" />
                  {t("dashboard.loadingPatients")}
                </div>
              ) : patientPreview.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {patientPreview.map((patient) => {
                    const name = patient.fullName?.trim() || t("dashboard.unknownPatient");

                    return (
                      <button
                        key={patient.userId}
                        type="button"
                        className="w-full p-4 text-left hover:bg-muted/20 transition-colors"
                        onClick={() =>
                          navigate(`/patients/nutritionist/${encodeURIComponent(patient.userId)}`)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {name.charAt(0).toUpperCase()}
                          </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">
                              {formatPatientGoalLabel(t, patient.goal)}
                  </p>
                </div>
              </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Users size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{t("dashboard.noPatients")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
