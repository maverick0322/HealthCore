import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { AlertCircle, CalendarDays, Loader2, Plus, Stethoscope } from "lucide-react";

import { PatientNav } from "@/features/patient/components/PatientNav";
import { DashboardWeightCard } from "@/features/patient/components/DashboardWeightCard";
import { HealthGoalsCard } from "@/features/patient/components/HealthGoalsCard";
import { ProfileAvatar } from "@/shared/components/ProfileAvatar";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { clinicalApi } from "@/features/clinical/services/clinicalService";
import type {
  NutritionistProfileResponse,
  PatientProfileResponse,
} from "@/features/clinical/types/clinical.types";
import { usePatientAppointments } from "@/features/patient/hooks/usePatientAppointments";
import {
  formatLocalDate,
  formatLocalTime,
} from "@/features/agenda/utils/agendaDateUtils";
import {
  formatConsultationTypeLabel,
  formatNutritionistSpecializationLabel,
} from "@/features/onboarding/utils/profilePresentation";

import { useTodaySummary } from "@/features/tracking/hooks/useTodaySummary";
import { WaterTrackerCard } from "@/features/tracking/components/WaterTrackerCard";
import { useTodayMeals } from "@/features/tracking/hooks/useTodayMeals";
import { TodayMealsList } from "@/features/tracking/components/TodayMealsList";

const getFirstName = (name: string | null | undefined) =>
  name?.trim().split(/\s+/)[0] ?? null;

const getNutritionistSpecialtyChips = (
  t: TFunction,
  profile: NutritionistProfileResponse | null,
) => {
  if (!profile) return [];

  return profile.specializations.slice(0, 3).map((specialization) =>
    specialization === "OTHER" && profile.customSpecialization
      ? profile.customSpecialization
      : formatNutritionistSpecializationLabel(t, specialization),
  );
};

export const PatientDashboardPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("patient");

  const { summary, addWater, removeWater, isLoading: isSummaryLoading, error: summaryError } = useTodaySummary();
  const { meals, isLoading: isMealsLoading, error: mealsError } = useTodayMeals();

  const [profile, setProfile] = useState<PatientProfileResponse | null>(null);
  const [nutritionistProfile, setNutritionistProfile] =
    useState<NutritionistProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const {
    appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    fetchAppointments,
  } = usePatientAppointments();

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  const loadProfile = useCallback(
    async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
      if (showLoading) {
        setProfileLoading(true);
      }
      setProfileError(null);

      try {
        const patientProfile = await clinicalApi.getMyProfile();
        setProfile(patientProfile);

        if (patientProfile.nutritionistId?.trim()) {
          try {
            const linkedProfile = await clinicalApi.getMyLinkedNutritionistProfile();
            setNutritionistProfile(linkedProfile);
          } catch {
            setNutritionistProfile(null);
          }
        } else {
          setNutritionistProfile(null);
        }
      } catch {
        setProfile(null);
        setNutritionistProfile(null);
        setProfileError(t("dashboard.profileLoadError"));
      } finally {
        if (showLoading) {
          setProfileLoading(false);
        }
      }
    },
    [t]
  );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const handleWindowRefresh = () => {
      if (document.visibilityState === "visible") {
        void loadProfile({ showLoading: false });
      }
    };

    window.addEventListener("focus", handleWindowRefresh);
    document.addEventListener("visibilitychange", handleWindowRefresh);

    return () => {
      window.removeEventListener("focus", handleWindowRefresh);
      document.removeEventListener("visibilitychange", handleWindowRefresh);
    };
  }, [loadProfile]);

  const nextAppointment = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((appointment) => appointment.status !== "CANCELLED")
      .filter((appointment) => new Date(appointment.endTime).getTime() >= now)
      .sort(
        (left, right) =>
          new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
      )[0] ?? null;
  }, [appointments]);

  const displayName =
    profile?.firstName?.trim() ||
    getFirstName(profile?.fullName) ||
    null;

  const nutritionistName =
    nutritionistProfile?.fullName?.trim() || t("dashboard.assignedNutritionist");
  const specialtyChips = getNutritionistSpecialtyChips(t, nutritionistProfile);
  const consultationChips =
    nutritionistProfile?.consultationTypes
      .slice(0, 2)
      .map((type) => formatConsultationTypeLabel(t, type)) ?? [];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <PatientNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="border-b border-border bg-primary/10 md:pl-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6">
          {profileLoading ? (
            <div
              aria-hidden="true"
              className="h-8 w-44 rounded-md bg-foreground/10 animate-pulse sm:h-9 sm:w-56"
            />
          ) : (
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t("dashboard.greeting", {
                name: displayName ?? t("dashboard.defaultName"),
              })}
            </h1>
          )}
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("dashboard.greetingSubtitle")}
          </p>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-20 md:pb-6 md:pl-56 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 xl:gap-6 items-start">
          
          <div className="h-full">
            <HealthGoalsCard />
          </div>

          <div className="space-y-5">
            <DashboardWeightCard />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Card id="card-appointment" className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CalendarDays size={16} className="text-primary" />
                    <span className="uppercase text-xs text-muted-foreground">{t("dashboard.nextAppointment")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
                  {appointmentsLoading ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
                      <Loader2 size={16} className="animate-spin" />
                      {t("dashboard.loadingAppointments")}
                    </div>
                  ) : appointmentsError ? (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-4 text-sm text-destructive">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{appointmentsError}</span>
                    </div>
                  ) : nextAppointment ? (
                    <div className="rounded-lg border border-border bg-muted/40 p-4">
                      <p className="text-sm font-semibold">
                        {formatLocalDate(nextAppointment.startTime)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatLocalTime(nextAppointment.startTime)} -{" "}
                        {formatLocalTime(nextAppointment.endTime)}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {nutritionistName}
                        </span>
                        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {t(`appointments.status.${nextAppointment.status}`)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-sm text-muted-foreground">
                      {t("dashboard.noAppointment")}
                    </div>
                  )}

                  <Button
                    id="btn-schedule-appointment"
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs mt-3"
                    onClick={() => navigate("/appointments/patient")}
                  >
                    {nextAppointment ? "Reagendar" : (
                      <>
                        <Plus size={13} />
                        {t("dashboard.scheduleAppointment")}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* NUEVO: Inyectando loading y error */}
              <WaterTrackerCard 
                totalWaterMl={summary?.totalWaterMl ?? 0} 
                onAddWater={addWater}
                onRemoveWater={removeWater}
                isLoading={isSummaryLoading}
                error={summaryError}
              />
            </div>

            <Card id="card-nutritionist">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Stethoscope size={16} className="text-primary" />
                  {t("dashboard.nutritionistCard")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profileLoading ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    {t("dashboard.loadingProfile")}
                  </div>
                ) : profileError ? (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-4 text-sm text-destructive">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                ) : !profile?.nutritionistId ? (
                  <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-4 text-sm">
                    <p className="font-semibold text-amber-700 dark:text-amber-300">
                      {t("dashboard.noAssignedNutritionist")}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {t("dashboard.noAssignedNutritionistDesc")}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => navigate("/scanning/patient")}
                    >
                      {t("appointments.linkNutritionistAction")}
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/40 p-4">
                    <div className="flex items-start gap-3">
                      <ProfileAvatar
                        name={nutritionistName}
                        photoUrl={nutritionistProfile?.profilePhotoUrl}
                        size="sm"
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{nutritionistName}</p>
                        {specialtyChips.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {specialtyChips.map((chip) => (
                              <span
                                key={chip}
                                className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}
                        {consultationChips.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {consultationChips.map((chip) => (
                              <span
                                key={chip}
                                className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="w-full mt-2">
          {/* NUEVO: Inyectando el error aquí también */}
          <TodayMealsList 
            meals={meals} 
            isLoading={isMealsLoading} 
            error={mealsError} 
          />
        </div>
      </main>
    </div>
  );
};