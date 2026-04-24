import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  Leaf,
  Target,
  Zap,
  Ruler,
  Weight,
  Activity,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Pencil,
  KeyRound,
  BellOff,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { usePatientOnboardingStore } from "@/features/onboarding/store/usePatientOnboardingStore";

import { PatientNav } from "@/features/patient/components/PatientNav";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Calculate BMI and its display category key */
function getBmi(weightKg: number, heightCm: number) {
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  let categoryKey: "underweight" | "normal" | "overweight" | "obese";
  if (bmi < 18.5) categoryKey = "underweight";
  else if (bmi < 25) categoryKey = "normal";
  else if (bmi < 30) categoryKey = "overweight";
  else categoryKey = "obese";
  return { value: bmi.toFixed(1), categoryKey };
}

/** Colour token for each BMI range */
function bmiColor(category: string) {
  switch (category) {
    case "underweight":
      return "text-blue-500";
    case "normal":
      return "text-emerald-500";
    case "overweight":
      return "text-amber-500";
    case "obese":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}

/** Map onboarding goal key → i18n key used in patient.json */
const GOAL_MAP: Record<string, string> = {
  "weight-loss": "WEIGHT_LOSS",
  "muscle-gain": "MUSCLE_GAIN",
  health: "HEALTH",
  performance: "PERFORMANCE",
};

// ── Component ──────────────────────────────────────────────────────────────

/**
 * PatientProfilePage
 *
 * Presentation-only page that displays the authenticated patient's identity
 * information (from `useAuthStore`) and their health / preference data
 * (from `usePatientOnboardingStore`).
 *
 * No mutations or service calls are made here — this screen is read-only
 * as per the current sprint scope.
 */
export const PatientProfilePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("patient");
  const { t: tAuth } = useTranslation("auth");

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const physical = usePatientOnboardingStore((s) => s.physical);
  const goal = usePatientOnboardingStore((s) => s.goal);
  const preferences = usePatientOnboardingStore((s) => s.preferences);

  // Determine if onboarding data was ever filled in (non-default weight check)
  const hasHealthData = physical.weight > 0 && physical.height > 0;

  const bmi = hasHealthData
    ? getBmi(physical.weight, physical.height)
    : null;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleGoToOnboarding = () => {
    navigate("/onboarding/patient");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      {/* ── Responsive Nav (sidebar desktop / bottom bar mobile) ── */}
      <PatientNav />

      {/* ── Top Controls ───────────────────────────────────────── */}
      <div className="md:pl-56">
        <SettingsBar />
      </div>

      {/* ── Header Banner ──────────────────────────────────────── */}
      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        {/* Decorative background blob */}
        <div
          aria-hidden
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-8">
          {/* Only show 'Back to Dashboard' on mobile since desktop has sidebar nav */}
          <button
            id="btn-back-dashboard"
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 md:hidden"
          >
            <ChevronLeft size={16} />
            {t("profile.backToDashboard")}
          </button>

          <div className="flex items-center gap-5">
            {/* Avatar placeholder */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner flex-shrink-0">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                {user?.email?.split("@")[0] ?? "—"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {tAuth("patient")}
              </p>
              {/* Email verified badge */}
              <div className="flex items-center gap-1.5 mt-1.5">
                {user?.emailVerified ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <AlertCircle size={14} className="text-amber-500" />
                )}
                <span className="text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-20 md:pb-8 md:pl-56 animate-in fade-in slide-in-from-bottom-2 duration-500">

        {/* ── Quick Stats Row ──────────────────────────────────── */}
        {hasHealthData && (
          <div
            id="section-quick-stats"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {/* Height */}
            <StatCard
              icon={<Ruler size={18} className="text-primary" />}
              label={t("profile.height")}
              value={`${physical.height} cm`}
            />
            {/* Weight */}
            <StatCard
              icon={<Weight size={18} className="text-primary" />}
              label={t("profile.weight")}
              value={`${physical.weight} kg`}
            />
            {/* BMI */}
            {bmi && (
              <StatCard
                icon={<Activity size={18} className={bmiColor(bmi.categoryKey)} />}
                label={t("profile.bmi")}
                value={bmi.value}
                valueClassName={bmiColor(bmi.categoryKey)}
                subValue={t(`profile.bmiCategories.${bmi.categoryKey}`)}
              />
            )}
            {/* Age */}
            <StatCard
              icon={<Zap size={18} className="text-primary" />}
              label={t("profile.age")}
              value={`${physical.age} ${t("profile.years")}`}
            />
          </div>
        )}

        {/* ── Account Card ─────────────────────────────────────── */}
        <Card id="card-account-info">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Mail size={16} className="text-primary" />
              {t("profile.accountSettings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileRow label={t("profile.email")} value={user?.email} />
            <ProfileRow
              label={t("profile.provider")}
              value={user?.provider}
            />
            <ProfileRow
              label={t("profile.emailVerified")}
              value={
                user?.emailVerified ? (
                  <span className="flex items-center gap-1 text-emerald-500 font-medium text-sm">
                    <CheckCircle2 size={14} />
                    Verificado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-500 font-medium text-sm">
                    <AlertCircle size={14} />
                    Sin verificar
                  </span>
                )
              }
            />
          </CardContent>
        </Card>

        {/* ── Health Data Card (or CTA if missing) ─────────────── */}
        {hasHealthData ? (
          <Card id="card-health-data">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" />
                {t("profile.healthData")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfileRow
                label={t("profile.gender")}
                value={t(`profile.genderLabels.${physical.gender}`)}
              />
              <ProfileRow
                label={t("profile.activityLevel")}
                value={t(`profile.activityLevels.${physical.activityLevel}`)}
              />
              <ProfileRow
                label={t("profile.mainGoal")}
                value={t(`profile.goals.${GOAL_MAP[goal] ?? goal}`)}
              />
            </CardContent>
          </Card>
        ) : (
          /* CTA when onboarding not completed */
          <Card
            id="card-complete-profile"
            className="border-dashed border-primary/40 bg-primary/5"
          >
            <CardContent className="py-8 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold">{t("profile.completeProfile")}</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {t("profile.completeProfileDesc")}
              </p>
              <Button
                id="btn-go-to-onboarding"
                onClick={handleGoToOnboarding}
                className="mt-2 gap-2"
              >
                {t("profile.goToOnboarding")}
                <ArrowRight size={16} />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Preferences Card ─────────────────────────────────── */}
        {hasHealthData && (
          <Card id="card-preferences">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Leaf size={16} className="text-primary" />
                {t("profile.preferences")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfileRow
                label={t("profile.dietType")}
                value={t(`profile.diets.${preferences.dietType}`)}
              />
              <ProfileRow
                label={t("profile.allergies")}
                value={
                  preferences.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {preferences.allergies.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-xs font-medium"
                        >
                          {t(`profile.allergyItems.${a}`, { defaultValue: a })}
                        </span>
                      ))}
                    </div>
                  ) : (
                    t("profile.noAllergies")
                  )
                }
              />
            </CardContent>
          </Card>
        )}

        {/* ── Account Actions Card ──────────────────────────────── */}
        <Card id="card-account-actions">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Pencil size={16} className="text-primary" />
              {t("profile.actionsSection")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pb-2">
            {/* Edit health data */}
            {hasHealthData && (
              <ActionRow
                id="btn-edit-health-data"
                icon={<ShieldCheck size={16} className="text-primary" />}
                label={t("profile.editHealthData")}
              />
            )}
            {/* Edit preferences */}
            {hasHealthData && (
              <ActionRow
                id="btn-edit-preferences"
                icon={<Leaf size={16} className="text-primary" />}
                label={t("profile.editPreferences")}
              />
            )}
            {/* Change password — only for LOCAL provider */}
            {(!user?.provider || user.provider === "LOCAL") && (
              <ActionRow
                id="btn-change-password"
                icon={<KeyRound size={16} className="text-primary" />}
                label={t("profile.changePassword")}
                desc={t("profile.changePasswordDesc")}
              />
            )}
            {/* Disable notifications */}
            <ActionRow
              id="btn-disable-notifications"
              icon={<BellOff size={16} className="text-primary" />}
              label={t("profile.disableNotifications")}
              desc={t("profile.notificationsDesc")}
            />
          </CardContent>
        </Card>

        {/* ── Logout ───────────────────────────────────────────── */}
        <Button
          id="btn-logout"
          variant="outline"
          onClick={handleLogout}
          className="w-full h-11 font-semibold border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors gap-2"
        >
          <LogOut size={16} />
          {t("profile.logout")}
        </Button>

        <footer className="text-center pb-4">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
            {tAuth("footer")}
          </p>
        </footer>
      </main>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
  subValue?: string;
}

/** Compact stat tile used in the quick-stats grid. */
const StatCard = ({
  icon,
  label,
  value,
  valueClassName,
  subValue,
}: StatCardProps) => (
  <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="text-xs font-medium truncate">{label}</span>
    </div>
    <p className={`text-lg font-bold leading-tight ${valueClassName ?? ""}`}>
      {value}
    </p>
    {subValue && (
      <p className="text-xs text-muted-foreground">{subValue}</p>
    )}
  </div>
);

interface ProfileRowProps {
  label: string;
  value?: string | React.ReactNode;
}

/** Horizontal label / value row inside a Card. */
const ProfileRow = ({ label, value }: ProfileRowProps) => (
  <div className="flex items-start justify-between gap-4 py-1 border-b border-border/50 last:border-0">
    <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
    <span className="text-sm font-medium text-right leading-snug">
      {value ?? <span className="text-muted-foreground/60">—</span>}
    </span>
  </div>
);

interface ActionRowProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  desc?: string;
}

/**
 * Tappable row for account actions (non-functional — UI only).
 * Styled as a list item with a trailing chevron to communicate interactivity.
 */
const ActionRow = ({ id, icon, label, desc }: ActionRowProps) => (
  <button
    id={id}
    type="button"
    className="w-full flex items-center gap-3 py-3 px-1 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors text-left group"
    disabled
    aria-label={label}
  >
    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
      {icon}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium leading-snug">{label}</p>
      {desc && (
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      )}
    </div>
    <ChevronRight
      size={16}
      className="text-muted-foreground flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
    />
  </button>
);
