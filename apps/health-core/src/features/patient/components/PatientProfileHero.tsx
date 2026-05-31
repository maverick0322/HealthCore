import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, ChevronLeft, Pencil } from 'lucide-react';

import type { PatientProfileResponse } from '@/features/clinical/types/clinical.types';
import { ProfileAvatar } from '@/shared/components/ProfileAvatar';
import { Button } from '@/shared/ui/button';

interface PatientProfileHeroProps {
  profile: PatientProfileResponse | null;
  displayName: string;
  email?: string | null;
  emailVerified?: boolean;
  onBack: () => void;
  onEditProfile: () => void;
  profilePhotoUpload: {
    accept: string;
    handleFileSelected: (file: File) => Promise<void> | void;
    isUploading: boolean;
    error: string | null;
  };
}

export function PatientProfileHero({
  profile,
  displayName,
  email,
  emailVerified,
  onBack,
  onEditProfile,
  profilePhotoUpload,
}: Readonly<PatientProfileHeroProps>) {
  const { t } = useTranslation('patient');
  const { t: tAuth } = useTranslation('auth');

  return (
    <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
      <div
        aria-hidden
        className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none"
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-8">
        <button
          id="btn-back-dashboard"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 md:hidden"
        >
          <ChevronLeft size={16} />
          {t('profile.backToDashboard')}
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <ProfileAvatar
              name={displayName}
              photoUrl={profile?.profilePhotoUrl}
              size="lg"
              editable
              accept={profilePhotoUpload.accept}
              onFileSelected={(file) => {
                void profilePhotoUpload.handleFileSelected(file);
              }}
              isUploading={profilePhotoUpload.isUploading}
              error={profilePhotoUpload.error}
              cameraLabel={t('profile.changePhoto')}
              className="flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{displayName}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{tAuth('patient')}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                {emailVerified ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <AlertCircle size={14} className="text-amber-500" />
                )}
                <span className="text-xs text-muted-foreground">{email}</span>
              </div>
            </div>
          </div>

          <Button
            id="btn-edit-profile"
            variant="outline"
            className="gap-2"
            onClick={onEditProfile}
          >
            <Pencil size={16} />
            {t('profile.editProfile')}
          </Button>
        </div>
      </div>
    </div>
  );
}
