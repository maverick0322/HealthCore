import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Award, FileText, LogOut, Mail, MapPin, Pencil, Phone, User } from 'lucide-react';

import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { ClinicAddressPayload, NutritionistProfileResponse } from '@/features/clinical/types/clinical.types';
import { NutritionistNav } from '@/features/nutritionist/components/NutritionistNav';
import {
  consultationTypeOptions,
  formatConsultationTypeLabel,
  formatNutritionistSpecializationLabel,
  getConsultationTypeMetadata,
  getNutritionistSpecializationMetadata,
} from '@/features/onboarding/utils/profilePresentation';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

const formatAddress = (address?: ClinicAddressPayload | null) => {
  if (!address) {
    return null;
  }

  const parts = [
    [address.street?.trim(), address.exteriorNumber?.trim()].filter(Boolean).join(' '),
    address.interiorNumber?.trim() ? `Int. ${address.interiorNumber.trim()}` : null,
    address.neighborhood?.trim(),
    address.city?.trim(),
    address.state?.trim(),
    address.postalCode?.trim(),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : null;
};

export const NutritionistProfilePage = () => {
  const { t } = useTranslation('nutritionist');
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<NutritionistProfileResponse | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await clinicalApi.getMyNutritionistProfile();
        setProfile(response);
      } catch {
        setProfile(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    void loadProfile();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const specializationSummary = useMemo(() => {
    if (!profile?.specializations.length) {
      return t('profile.pendingProfile');
    }

    return profile.specializations.map((item) => formatNutritionistSpecializationLabel(t, item)).join(', ');
  }, [profile?.specializations, t]);

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <NutritionistNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="relative overflow-hidden border-b border-border bg-primary/10 md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 pt-20 pb-6 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('profile.title')}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('profile.subtitle')}</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => navigate('/profile/nutritionist/edit')}>
            <Pencil size={16} />
            {t('profile.editProfile')}
          </Button>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto space-y-6 px-4 py-6 pb-24 md:pl-56 md:pb-8 sm:px-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Card className="overflow-hidden border-border/50 shadow-sm">
          <div className="h-32 bg-primary/20" />
          <div className="px-6 pb-6">
            <div className="relative mb-6 flex justify-between -mt-12">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-primary text-4xl font-bold text-primary-foreground">
                {(profile?.fullName ?? user?.email ?? 'N').charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold">{profile?.fullName ?? user?.email ?? '--'}</h2>
              <div className="flex flex-wrap gap-2">
                {(profile?.specializations ?? []).length > 0 ? (
                  profile?.specializations.map((specialization) => {
                    const metadata = getNutritionistSpecializationMetadata(specialization);
                    const Icon = metadata?.icon ?? Award;

                    return (
                      <span
                        key={specialization}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        <Icon size={14} />
                        {formatNutritionistSpecializationLabel(t, specialization)}
                      </span>
                    );
                  })
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Award size={14} />
                    {specializationSummary}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User size={18} className="text-primary" />
                {t('profile.contactInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <InfoRow icon={<Mail size={16} className="text-muted-foreground" />} value={user?.email ?? '--'} />
              <InfoRow
                icon={<Phone size={16} className="text-muted-foreground" />}
                value={profile?.phone || t('profile.noPhone')}
              />
              <InfoRow
                icon={<MapPin size={16} className="text-muted-foreground" />}
                value={formatAddress(profile?.clinicAddress) ?? t('profile.noAddress')}
              />
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText size={18} className="text-primary" />
                {t('profile.credentials')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">{t('profile.license')}</p>
                <p className="text-sm font-medium">{profile?.professionalLicense ?? '--'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">{t('profile.consultationType')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(profile?.consultationTypes ?? []).length > 0 ? (
                    profile?.consultationTypes.map((type) => {
                      const metadata = getConsultationTypeMetadata(type);
                      const Icon = metadata?.icon ?? consultationTypeOptions[0].icon ?? Award;

                      return (
                        <span
                          key={type}
                          className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                        >
                          <Icon size={13} />
                          {formatConsultationTypeLabel(t, type)}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('profile.noConsultationTypes')}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm md:col-span-2">
            <CardHeader className="border-b border-border/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText size={18} className="text-primary" />
                {t('profile.bio')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {profile?.bio || t('profile.completeBioPrompt')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Button
            id="btn-logout"
            variant="outline"
            onClick={handleLogout}
            className="w-full h-11 gap-2 border-destructive/30 font-semibold text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut size={16} />
            {t('profile.logout')}
          </Button>
        </div>
      </main>
    </div>
  );
};

const InfoRow = ({ icon, value }: { icon: ReactNode; value: string }) => (
  <div className="flex items-start gap-3">
    {icon}
    <span className="text-sm leading-relaxed">{value}</span>
  </div>
);
