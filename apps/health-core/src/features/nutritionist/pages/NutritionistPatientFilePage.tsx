import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  User,
  Ruler,
  Weight,
  Flame,
  UtensilsCrossed,
  CalendarDays,
  FileText,
  CheckCircle2,
  Loader2,
  UserMinus,
  AlertCircle,
} from "lucide-react";

import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  clinicalApi,
  createObservation,
  getPatientObservations,
} from "../../clinical/services/clinicalService";
import type {
  ObservationResponse,
  NutritionistPatientProfileResponse,
  NutritionPlanViewResponse,
} from "../../clinical/types/clinical.types";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";
import { NutritionPlanWorkspace } from "@/features/nutrition-plan/components/NutritionPlanWorkspace";

const getDisplayIdentity = (userId: string): string => {
  const normalized = userId.trim();
  return normalized || "Paciente";
};

const getAgeFromBirthDate = (birthDate: string): number | null => {
  if (!birthDate) {
    return null;
  }

  const today = new Date();
  const parsedBirthDate = new Date(birthDate);
  if (Number.isNaN(parsedBirthDate.getTime())) {
    return null;
  }

  let age = today.getFullYear() - parsedBirthDate.getFullYear();
  const monthDiff = today.getMonth() - parsedBirthDate.getMonth();
  const dayDiff = today.getDate() - parsedBirthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
};

const formatHeightInMeters = (heightCm: number): string => {
  return `${(heightCm / 100).toFixed(2)} m`;
};

const calculateBmi = (weightKg: number, heightCm: number): string => {
  return (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
};

export const NutritionistPatientFilePage = () => {
  const { id: patientIdParam } = useParams<{ id: string }>();
  const patientId = useMemo(
    () => (patientIdParam ? decodeURIComponent(patientIdParam) : ""),
    [patientIdParam]
  );
  const [patient, setPatient] = useState<NutritionistPatientProfileResponse | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  const [patientLoadError, setPatientLoadError] = useState<string | null>(null);
  const [observations, setObservations] = useState<ObservationResponse[]>([]);
  const [nutritionPlanView, setNutritionPlanView] = useState<NutritionPlanViewResponse | null>(null);
  const [isLoadingNutritionPlan, setIsLoadingNutritionPlan] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation("nutritionist");

  const [activeTab, setActiveTab] = useState<"overview" | "plan" | "history">("overview");
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) {
        setPatientLoadError(t("patients.file.error"));
        setIsLoadingPatient(false);
        return;
      }

      try {
        setIsLoadingPatient(true);
        setPatientLoadError(null);
        const response = await clinicalApi.getNutritionistPatientProfile(patientId);
        setPatient(response);
      } catch (error) {
        console.error("Error loading patient profile:", error);
        setPatientLoadError(t("patients.file.error"));
      } finally {
        setIsLoadingPatient(false);
      }
    };

    void loadPatient();
  }, [patientId, t]);

  useEffect(() => {
    if (!patientId) {
      return;
    }

    void loadObservations();
  }, [patientId]);

  useEffect(() => {
    if (!patientId || activeTab !== "plan") {
      return;
    }

    const loadNutritionPlan = async () => {
      try {
        setIsLoadingNutritionPlan(true);
        const response = await clinicalApi.getNutritionistPatientNutritionPlan(patientId);
        setNutritionPlanView(response);
      } catch (error) {
        console.error("Error loading nutrition plan:", error);
      } finally {
        setIsLoadingNutritionPlan(false);
      }
    };

    void loadNutritionPlan();
  }, [activeTab, patientId]);

  const loadObservations = async () => {
    try {
      const data = await getPatientObservations(patientId);
      setObservations(data);
    } catch (error) {
      console.error("Error loading observations:", error);
    }
  };

  const confirmUnlinkPatient = async () => {
    if (!patientId) {
      return;
    }

    setIsUnlinking(true);
    try {
      await clinicalApi.unlinkNutritionist(patientId);
      navigate("/patients/nutritionist");
    } catch (error) {
      console.error("Error unlinking patient:", error);
      setIsUnlinking(false);
      setShowUnlinkModal(false);
    }
  };

  const handleSaveObservation = async () => {
    if (!newNote.trim() || !patientId) {
      return;
    }

    setIsSavingNote(true);
    try {
      await createObservation({ patientId, note: newNote });
      setNewNote("");
      await loadObservations();
    } catch (error) {
      console.error("Error saving observation:", error);
    } finally {
      setIsSavingNote(false);
    }
  };

  const patientIdentity = patient ? patient.fullName?.trim() || getDisplayIdentity(patient.userId) : "";
  const patientAge = patient ? getAgeFromBirthDate(patient.birthDate) : null;

  const handleSaveNutritionPlan = async (
    payload: Parameters<typeof clinicalApi.upsertNutritionistPatientNutritionPlan>[1]
  ) => {
    const response = await clinicalApi.upsertNutritionistPatientNutritionPlan(patientId, payload);
    setNutritionPlanView(response);
    return response;
  };

  const renderMainContent = () => {
    if (isLoadingPatient) {
      return (
        <div className="py-16 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    }

    if (!patient || patientLoadError) {
      return (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
            <AlertCircle size={32} className="opacity-40" />
            <p>{patientLoadError ?? t("patients.file.error")}</p>
          </CardContent>
        </Card>
      );
    }

    if (activeTab === "overview") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <User size={18} className="text-primary" /> {t("patients.file.tabOverview")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                  <CalendarDays size={18} className="mx-auto text-muted-foreground mb-1" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">
                    {t("patients.file.age")}
                  </p>
                  <p className="text-lg font-bold">
                    {patientAge !== null ? `${patientAge} anos` : "--"}
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                  <Weight size={18} className="mx-auto text-muted-foreground mb-1" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">
                    {t("patients.file.weight")}
                  </p>
                  <p className="text-lg font-bold">{patient.weightKg} kg</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                  <Ruler size={18} className="mx-auto text-muted-foreground mb-1" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">
                    {t("patients.file.height")}
                  </p>
                  <p className="text-lg font-bold">{formatHeightInMeters(patient.heightCm)}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center flex flex-col justify-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">IMC</p>
                  <p className="text-xl font-bold text-primary">
                    {calculateBmi(patient.weightKg, patient.heightCm)}
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 flex items-start gap-3">
                <Flame size={20} className="text-amber-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-1">
                    {t("patients.file.objective")}
                  </h4>
                  <p className="text-amber-600/90 dark:text-amber-400/90 text-sm">
                    {t("patients.objectivePlaceholder")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText size={18} className="text-primary" /> {t("patients.file.planSummaryTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground mb-1">
                  {t("patients.file.currentPlanLabel")}
                </p>
                <p className="font-semibold text-sm">{t("patients.file.planPlaceholder")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("patients.file.planUpdatedPlaceholder")}
                </p>
              </div>
              <Button className="w-full" size="sm" onClick={() => setActiveTab("plan")}>
                {t("patients.file.viewPlan")}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeTab === "plan") {
      return (
        <Card>
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2">
              <UtensilsCrossed size={18} className="text-primary" /> {t("patients.file.tabPlan")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <NutritionPlanWorkspace
              namespace="nutritionist"
              view={nutritionPlanView}
              isLoading={isLoadingNutritionPlan}
              onSave={handleSaveNutritionPlan}
              onSearchFoods={clinicalApi.searchCatalogFoods}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText size={18} className="text-primary" /> {t("patients.file.tabHistory")}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-5 space-y-8">
          <div className="bg-muted/10 p-4 rounded-xl border border-border/50 space-y-3">
            <textarea
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
              disabled={isSavingNote}
              placeholder={t("patients.file.newNotePlaceholder")}
              className="w-full min-h-[80px] p-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y transition-colors"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSaveObservation}
                disabled={isSavingNote || !newNote.trim()}
                className="flex items-center gap-2"
              >
                {isSavingNote && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("patients.file.saveObservation")}
              </Button>
            </div>
          </div>

          <div className="relative border-l-2 border-border/50 ml-3 space-y-6">
            {observations.length === 0 ? (
              <p className="text-sm text-muted-foreground italic pl-4">
                {t("patients.file.noObservations")}
              </p>
            ) : (
              observations.map((observation) => (
                <div key={observation.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary" />

                  <p className="text-xs font-bold text-muted-foreground mb-1">
                    {new Date(observation.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {observation.note}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/patients/nutritionist")}
            className="w-fit mb-4 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            {t("patients.file.back")}
          </Button>

          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-lg border-4 border-background">
              {patientIdentity ? patientIdentity.charAt(0).toUpperCase() : "P"}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                {patientIdentity || t("patients.file.loading")}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={12} /> {t("patients.file.statusActive")}
                </span>
                <span className="text-sm text-muted-foreground font-medium truncate">
                  ID: {patientIdentity || "--"}
                </span>
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowUnlinkModal(true)}
              className="flex items-center gap-2 self-start sm:self-auto"
              disabled={isLoadingPatient || !patient}
            >
              <UserMinus size={16} />
              {t("patients.file.unlink")}
            </Button>
          </div>

          <div className="flex items-center gap-6 mt-8 overflow-x-auto hide-scrollbar border-b border-border/50 pb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("patients.file.tabOverview")}
            </button>
            <button
              onClick={() => setActiveTab("plan")}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "plan"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("patients.file.tabPlan")}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "history"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("patients.file.tabHistory")}
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {renderMainContent()}
      </main>

      <ConfirmModal
        isOpen={showUnlinkModal}
        onClose={() => setShowUnlinkModal(false)}
        onConfirm={confirmUnlinkPatient}
        title={t("patients.file.unlinkTitle")}
        description={t("patients.file.confirmUnlink")}
        icon={<UserMinus size={24} />}
        isLoading={isUnlinking}
        isDestructive={true}
        confirmText={t("patients.file.unlink")}
        cancelText={t("common.cancel")}
      />
    </div>
  );
};
