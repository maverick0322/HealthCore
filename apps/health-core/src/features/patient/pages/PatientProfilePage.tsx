import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BellOff,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Leaf,
  LogOut,
  Mail,
  Pencil,
  Ruler,
  ShieldCheck,
  User,
  Weight,
  Zap,
} from 'lucide-react';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { PatientProfileResponse } from '@/features/clinical/types/clinical.types';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { PatientNav } from '@/features/patient/components/PatientNav';
import {
  formatActivityLevelLabel,
  formatAllergyLabel,
  formatDietLabel,
  formatGenderLabel,
  formatIsoDateToDisplay,
  formatPatientGoalLabel,
} from '@/features/onboarding/utils/profilePresentation';
import { calculateAgeFromBirthDate } from '@/features/onboarding/utils/profileValidation';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

function getBmi(weightKg: number, heightCm: number) {
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  let categoryKey: 'underweight' | 'normal' | 'overweight' | 'obese';
  if (bmi < 18.5) categoryKey = 'underweight';
  else if (bmi < 25) categoryKey = 'normal';
  else if (bmi < 30) categoryKey = 'overweight';
  else categoryKey = 'obese';
  return { value: bmi.toFixed(1), categoryKey };
}

function bmiColor(category: string) {
  switch (category) {
    case 'underweight':
      return 'text-blue-500';
    case 'normal':
      return 'text-emerald-500';
    case 'overweight':
      return 'text-amber-500';
    case 'obese':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
}

export const PatientProfilePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('patient');
  const { t: tAuth } = useTranslation('auth');
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [profile, setProfile] = useState<PatientProfileResponse | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await clinicalApi.getMyProfile();
        setProfile(response);
      } catch {
        setProfile(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    void loadProfile();
  }, []);

  const handleConfirmUnlink = async () => {
    try {
      setIsUnlinking(true);
      await clinicalApi.unlinkPatient();
      setProfile((current) => (current ? { ...current, nutritionistId: null } : current));
      setShowUnlinkDialog(false);
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const bmi = useMemo(
    () => (profile ? getBmi(profile.weightKg, profile.heightCm) : null),
    [profile]
  );
  const age = profile ? calculateAgeFromBirthDate(profile.birthDate) : null;
  const displayName = profile?.fullName || user?.email?.split('@')[0] || '--';
  const allergyDisplay = profile
    ? profile.allergies.length > 0
      ? profile.allergies.map((allergy) => formatAllergyLabel(t, allergy)).join(', ')
      : t('profile.noAllergies')
    : t('profile.noAllergies');

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const handleChangePassword = () => {
    navigate("/forgot-password", { state: { email: user?.email } });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <PatientNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div
          aria-hidden
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-8">
          <button
            id="btn-back-dashboard"
            onClick={() => navigate("/home")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 md:hidden"
          >
            <ChevronLeft size={16} />
            {t('profile.backToDashboard')}
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-5 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner flex-shrink-0">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{displayName}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{tAuth('patient')}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {user?.emailVerified ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={14} className="text-amber-500" />
                  )}
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </div>
            </div>

            <Button
              id="btn-edit-profile"
              variant="outline"
              className="gap-2"
              onClick={() => navigate('/profile/edit/patient')}
            >
              <Pencil size={16} />
              {t('profile.editProfile')}
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-20 md:pb-8 md:pl-56 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {profile ? (
          <>
            <div id="section-quick-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={<Ruler size={18} className="text-primary" />}
                label={t('profile.height')}
                value={`${profile.heightCm} cm`}
              />
              <StatCard
                icon={<Weight size={18} className="text-primary" />}
                label={t('profile.weight')}
                value={`${profile.weightKg.toFixed(1)} kg`}
              />
              {bmi ? (
                <StatCard
                  icon={<Activity size={18} className={bmiColor(bmi.categoryKey)} />}
                  label={t('profile.bmi')}
                  value={bmi.value}
                  valueClassName={bmiColor(bmi.categoryKey)}
                  subValue={t(`profile.bmiCategories.${bmi.categoryKey}`)}
                />
              ) : null}
              <StatCard
                icon={<Zap size={18} className="text-primary" />}
                label={t('profile.age')}
                value={`${age ?? '--'} ${t('profile.years')}`}
              />
            </div>

            <Card id="card-account-info">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Mail size={16} className="text-primary" />
                  {t('profile.accountSettings')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProfileRow label={t('profile.name')} value={profile.fullName} />
                <ProfileRow label={t('profile.email')} value={user?.email} />
                <ProfileRow label={t('profile.birthDate')} value={formatIsoDateToDisplay(profile.birthDate)} />
              </CardContent>
            </Card>

            <Card id="card-health-data">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck size={16} className="text-primary" />
                  {t('profile.healthData')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProfileRow label={t('profile.gender')} value={formatGenderLabel(t, profile.gender)} />
                <ProfileRow
                  label={t('profile.activityLevel')}
                  value={formatActivityLevelLabel(t, profile.activityLevel, true)}
                />
                <ProfileRow label={t('profile.mainGoal')} value={formatPatientGoalLabel(t, profile.goal)} />
              </CardContent>
            </Card>

            <Card id="card-preferences">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Leaf size={16} className="text-primary" />
                  {t('profile.preferences')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProfileRow label={t('profile.dietType')} value={formatDietLabel(t, profile.dietType)} />
                <ProfileRow label={t('profile.allergies')} value={allergyDisplay} />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card id="card-complete-profile" className="border-dashed border-primary/40 bg-primary/5">
            <CardContent className="py-8 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold">{t('profile.completeProfile')}</p>
              <p className="text-sm text-muted-foreground max-w-xs">{t('profile.completeProfileDesc')}</p>
              <Button
                id="btn-go-to-onboarding"
                onClick={() => navigate('/onboarding/patient')}
                className="mt-2 gap-2"
              >
                {t('profile.goToOnboarding')}
                <ArrowRight size={16} />
              </Button>
            </CardContent>
          </Card>
        )}

        <Card id="card-account-actions">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Pencil size={16} className="text-primary" />
              {t('profile.actionsSection')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pb-2">
            {(!user?.provider || user.provider === 'LOCAL') && (
              <ActionRow
                id="btn-change-password"
                icon={<KeyRound size={16} className="text-primary" />}
                label={t("profile.changePassword")}
                desc={t("profile.changePasswordDesc")}
                onClick={handleChangePassword}
              />
            )}
            <ActionRow
              id="btn-disable-notifications"
              icon={<BellOff size={16} className="text-primary" />}
              label={t('profile.disableNotifications')}
              desc={t('profile.notificationsDesc')}
            />

            {profile ? (
              profile.nutritionistId ? (
                <ActionRow
                  id="btn-unlink-nutritionist"
                  icon={<LogOut size={16} />}
                  label={t('linking.unlinkNutritionist')}
                  desc={t('linking.unlinkDesc')}
                  variant="destructive"
                  onClick={() => {
                    if (!isUnlinking) setShowUnlinkDialog(true);
                  }}
                />
              ) : (
                <ActionRow
                  id="btn-link-nutritionist"
                  icon={<Camera size={16} />}
                  label={t('linking.linkNutritionist')}
                  desc={t('linking.linkDesc')}
                  onClick={() => navigate('/scanning/patient')}
                />
              )
            ) : null}
          </CardContent>
        </Card>

        <Button
          id="btn-logout"
          variant="outline"
          onClick={handleLogout}
          className="w-full h-11 font-semibold border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors gap-2"
        >
          <LogOut size={16} />
          {t('profile.logout')}
        </Button>

        <footer className="text-center pb-4">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
            {tAuth('footer')}
          </p>
        </footer>
      </main>

      <ConfirmModal
        isOpen={showUnlinkDialog}
        onClose={() => setShowUnlinkDialog(false)}
        onConfirm={handleConfirmUnlink}
        title={t('linking.confirmUnlink')}
        description={t('linking.confirmUnlinkDesc')}
        confirmText={t('linking.unlink')}
        cancelText={t('profile.cancel')}
        icon={<LogOut size={24} />}
        isLoading={isUnlinking}
        isDestructive={true}
      />
    </div>
  );
};

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
  subValue?: string;
}

const StatCard = ({ icon, label, value, valueClassName, subValue }: StatCardProps) => (
  <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="text-xs font-medium truncate">{label}</span>
    </div>
    <p className={`text-lg font-bold leading-tight ${valueClassName ?? ''}`}>{value}</p>
    {subValue ? <p className="text-xs text-muted-foreground">{subValue}</p> : null}
  </div>
);

interface ProfileRowProps {
  label: string;
  value?: string | ReactNode | null;
}

const ProfileRow = ({ label, value }: ProfileRowProps) => (
  <div className="flex items-start justify-between gap-4 py-1 border-b border-border/50 last:border-0">
    <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
    <span className="text-sm font-medium text-right leading-snug">
      {value ?? <span className="text-muted-foreground/60">--</span>}
    </span>
  </div>
);

interface ActionRowProps {
  id: string;
  icon: ReactNode;
  label: string;
  desc?: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive';
}

/**
 * Tappable row for account actions (non-functional — UI only).
 * Styled as a list item with a trailing chevron to communicate interactivity.
 */
const ActionRow = ({ id, icon, label, desc, onClick, variant = 'default' }: ActionRowProps) => (
  <button
    id={id}
    type="button"
    className="w-full flex items-center gap-3 py-3 px-1 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors text-left group"
    onClick={onClick}
    disabled={!onClick}
    aria-label={label}
  >
    <span
      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
      }`}
    >
      {icon}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium leading-snug">{label}</p>
      {desc ? <p className="text-xs text-muted-foreground truncate">{desc}</p> : null}
    </div>
    <ChevronRight
      size={16}
      className="text-muted-foreground flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
    />
  </button>
);
