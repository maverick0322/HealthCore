import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { PatientProfileResponse } from '@/features/clinical/types/clinical.types';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { formatAllergyLabel } from '@/features/onboarding/utils/profilePresentation';
import { calculateAgeFromBirthDate } from '@/features/onboarding/utils/profileValidation';
import { getPatientLinkingErrorMessage } from '@/features/clinical/utils/linkingErrorMessages';
import { useProfilePhotoUpload } from '@/shared/hooks/useProfilePhotoUpload';

function getBmi(weightKg: number, heightCm: number) {
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  let categoryKey: 'underweight' | 'normal' | 'overweight' | 'obese';
  if (bmi < 18.5) categoryKey = 'underweight';
  else if (bmi < 25) categoryKey = 'normal';
  else if (bmi < 30) categoryKey = 'overweight';
  else categoryKey = 'obese';
  return { value: bmi.toFixed(1), categoryKey };
}

export const usePatientProfile = () => {
  const { t } = useTranslation('patient');
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [profile, setProfile] = useState<PatientProfileResponse | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [unlinkFeedback, setUnlinkFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      setUnlinkFeedback(null);
      await clinicalApi.unlinkPatient();
      setProfile((current) => (current ? { ...current, nutritionistId: null } : current));
      setShowUnlinkDialog(false);
      setUnlinkFeedback({ type: 'success', message: t('linking.unlinkSuccess') });
    } catch (error) {
      setShowUnlinkDialog(false);
      setUnlinkFeedback({
        type: 'error',
        message: getPatientLinkingErrorMessage(error, t, 'unlink'),
      });
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleChangePassword = () => {
    navigate("/forgot-password", { state: { email: user?.email } });
  };

  const profilePhotoUpload = useProfilePhotoUpload({
    invalidTypeMessage: t('profile.photoInvalidType'),
    invalidSizeMessage: t('profile.photoInvalidSize'),
    persistErrorMessage: t('profile.photoPersistError'),
    uploadErrorMessages: {
      validation: t('profile.photoUploadValidationError'),
      rateLimit: t('profile.photoUploadRateLimitError'),
      network: t('profile.photoUploadNetworkError'),
      generic: t('profile.photoUploadGenericError'),
    },
    onUploadComplete: async (storageKey) => {
      const updatedProfile = await clinicalApi.updateMyProfilePhoto(storageKey);
      setProfile(updatedProfile);
    },
  });

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

  return {
    profile,
    setProfile,
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
  };
};
