import { useTranslation } from 'react-i18next';
import { ArrowRight, LogOut, ShieldCheck } from 'lucide-react';

import { PatientNav } from '@/features/patient/components/PatientNav';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import {
  formatActivityLevelLabel,
  formatDietLabel,
  formatGenderLabel,
  formatPatientGoalLabel,
} from '@/features/onboarding/utils/profilePresentation';
import { usePatientProfile } from '../hooks/usePatientProfile';
import { PatientProfileHero } from '@/features/patient/components/PatientProfileHero';
import { PatientProfileStatsGrid } from '@/features/patient/components/PatientProfileStatsGrid';
import { PatientProfileInfoCards } from '@/features/patient/components/PatientProfileInfoCards';
import { PatientProfileActionsCard } from '@/features/patient/components/PatientProfileActionsCard';

export const PatientProfilePage = () => {
  const { t } = useTranslation('patient');
  const { t: tAuth } = useTranslation('auth');

  const {
    profile,
    isLoadingProfile,
    showUnlinkDialog,
    setShowUnlinkDialog,
    isUnlinking,
    unlinkFeedback,
    handleConfirmUnlink,
    handleLogout,
    handleChangePassword,
    bmi,
    age,
    displayName,
    allergyDisplay,
    user,
    navigate,
    profilePhotoUpload,
  } = usePatientProfile();

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const genderLabel = profile ? formatGenderLabel(t, profile.gender) : '--';
  const activityLevelLabel = profile
    ? formatActivityLevelLabel(t, profile.activityLevel, true)
    : '--';
  const goalLabel = profile ? formatPatientGoalLabel(t, profile.goal) : '--';
  const dietLabel = profile ? formatDietLabel(t, profile.dietType) : '--';

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <PatientNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <PatientProfileHero
        profile={profile}
        displayName={displayName}
        email={user?.email}
        emailVerified={user?.emailVerified}
        onBack={() => navigate('/dashboard')}
        onEditProfile={() => navigate('/profile/edit/patient')}
        profilePhotoUpload={profilePhotoUpload}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-20 md:pb-8 md:pl-56 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {profile ? (
          <>
            <PatientProfileStatsGrid
              heightCm={profile.heightCm}
              weightKg={profile.weightKg}
              age={age}
              bmi={bmi}
            />

            <PatientProfileInfoCards
              profile={profile}
              email={user?.email}
              genderLabel={genderLabel}
              activityLevelLabel={activityLevelLabel}
              goalLabel={goalLabel}
              dietLabel={dietLabel}
              allergyDisplay={allergyDisplay}
            />
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

        <PatientProfileActionsCard
          userProvider={user?.provider}
          hasProfile={Boolean(profile)}
          nutritionistId={profile?.nutritionistId}
          isUnlinking={isUnlinking}
          unlinkFeedback={unlinkFeedback}
          onChangePassword={handleChangePassword}
          onOpenLinkNutritionist={() => navigate('/scanning/patient')}
          onOpenUnlinkNutritionist={() => setShowUnlinkDialog(true)}
        />

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
        isDestructive
      />
    </div>
  );
};
