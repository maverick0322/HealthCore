import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, ChevronRight, User, QrCode, AlertCircle } from "lucide-react";

import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { ProfileAvatar } from "@/shared/components/ProfileAvatar";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";
import { clinicalApi } from "@/features/clinical/services/clinicalService";
import type { NutritionistPatientProfileResponse } from "@/features/clinical/types/clinical.types";
import { nutritionistAgendaService } from "@/features/nutritionist/services/nutritionistAgendaService";
import type { AppointmentResponse } from "@/features/nutritionist/types/agenda.types";
import { formatPatientGoalLabel } from "@/features/onboarding/utils/profilePresentation";

interface NutritionistPatientCardViewModel {
  id: string;
  name: string;
  profilePhotoUrl: string | null;
  lastVisit: string;
  goal: string;
  futureAppointments: number;
  nextAppointmentAt: string | null;
}

const getDisplayIdentity = (userId: string): string => {
  const normalized = userId.trim();
  if (!normalized) {
    return "Paciente";
  }
  return normalized;
};

const toPatientCardViewModel = (
  patient: NutritionistPatientProfileResponse,
  futureAppointments: AppointmentResponse[],
  goalLabel: string,
  lastVisitPlaceholder: string
): NutritionistPatientCardViewModel => ({
  id: patient.userId,
  name: patient.fullName?.trim() || getDisplayIdentity(patient.userId),
  profilePhotoUrl: patient.profilePhotoUrl,
  lastVisit: futureAppointments[0]?.startTime ?? lastVisitPlaceholder,
  goal: goalLabel,
  futureAppointments: futureAppointments.length,
  nextAppointmentAt: futureAppointments[0]?.startTime ?? null,
});

export const NutritionistPatientsPage = () => {
  const { t } = useTranslation(["nutritionist", "onboarding"]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<NutritionistPatientProfileResponse[]>([]);
  const [futureAppointments, setFutureAppointments] = useState<AppointmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const now = new Date();
        const to = new Date(now);
        to.setDate(to.getDate() + 90);
        const [patientResponse, appointmentResponse] = await Promise.all([
          clinicalApi.getNutritionistPatients(),
          nutritionistAgendaService.getMyAppointments(now.toISOString(), to.toISOString()),
        ]);
        setPatients(patientResponse);
        setFutureAppointments(
          appointmentResponse
            .filter((appointment) =>
              appointment.status !== "CANCELLED" &&
              appointment.status !== "ATTENDED" &&
              new Date(appointment.startTime).getTime() > now.getTime()
            )
            .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())
        );
      } catch (error) {
        console.error("Error loading nutritionist patients:", error);
        setLoadError(t("patients.error"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadPatients();
  }, [t]);

  const patientCards = useMemo(
    () => {
      const appointmentsByPatient = new Map<string, AppointmentResponse[]>();
      futureAppointments.forEach((appointment) => {
        const current = appointmentsByPatient.get(appointment.patientId) ?? [];
        current.push(appointment);
        appointmentsByPatient.set(appointment.patientId, current);
      });

      return patients.map((patient) =>
        toPatientCardViewModel(
          patient,
          appointmentsByPatient.get(patient.userId) ?? [],
          formatPatientGoalLabel(t, patient.goal),
          t("patients.lastVisitPlaceholder")
        )
      );
    },
    [futureAppointments, patients, t]
  );

  const filteredPatients = useMemo(() => {
    return patientCards.filter((patient) => {
      return patient.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [patientCards, searchTerm]);

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="py-16 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl border-border">
          <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
          <p>{loadError}</p>
        </div>
      );
    }

    if (filteredPatients.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl border-border">
          <User size={32} className="mx-auto mb-3 opacity-20" />
          <p>{t("patients.empty")}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => (
          <Card
            key={patient.id}
            className="p-4 sm:p-5 flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => navigate(`/patients/nutritionist/${encodeURIComponent(patient.id)}`)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <ProfileAvatar
                  name={patient.name}
                  photoUrl={patient.profilePhotoUrl}
                  size="sm"
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-base group-hover:text-primary transition-colors truncate">
                    {patient.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {patient.goal}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
              <div className="min-w-0">
                <span className="block text-xs font-medium text-muted-foreground">
                  {patient.nextAppointmentAt
                    ? t("patients.nextAppointment", { date: new Date(patient.nextAppointmentAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) })
                    : t("patients.lastVisit", { date: patient.lastVisit })}
                </span>
                {patient.futureAppointments > 0 && (
                  <span className="mt-1 block text-[11px] font-medium text-amber-600 dark:text-amber-300">
                    {t("patients.futureAppointments", { count: patient.futureAppointments })}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary group-hover:bg-primary/10"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </Card>
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex items-start sm:items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t("patients.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("patients.subtitle")}
            </p>
          </div>
          <Button
            onClick={() => navigate("/qr/nutritionist")}
            className="flex items-center gap-2 shadow-md"
          >
            <QrCode size={18} />
            <span className="hidden sm:inline">{t("patients.addPatient")}</span>
          </Button>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:max-w-md space-y-2">
            <label htmlFor="nutritionist-patient-search" className="block text-sm font-medium text-foreground">
              {t("patients.searchLabel")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-muted-foreground" />
              </div>
              <input
                id="nutritionist-patient-search"
                type="text"
                placeholder={t("patients.searchPlaceholder")}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 ring-primary transition-all shadow-sm"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </div>

        {renderBody()}
      </main>
    </div>
  );
};
