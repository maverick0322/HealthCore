import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf, Mail, ShieldCheck } from 'lucide-react';

import { formatIsoDateToDisplay } from '@/features/onboarding/utils/profilePresentation';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface PatientProfileInfoCardsProps {
  profile: {
    fullName: string | null;
    birthDate: string;
  };
  email?: string | null;
  genderLabel: string;
  activityLevelLabel: string;
  goalLabel: string;
  dietLabel: string;
  allergyDisplay: string;
}

export function PatientProfileInfoCards({
  profile,
  email,
  genderLabel,
  activityLevelLabel,
  goalLabel,
  dietLabel,
  allergyDisplay,
}: Readonly<PatientProfileInfoCardsProps>) {
  const { t } = useTranslation('patient');

  return (
    <>
      <Card id="card-account-info">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Mail size={16} className="text-primary" />
            {t('profile.accountSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfileRow label={t('profile.name')} value={profile.fullName} />
          <ProfileRow label={t('profile.email')} value={email} />
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
          <ProfileRow label={t('profile.gender')} value={genderLabel} />
          <ProfileRow label={t('profile.activityLevel')} value={activityLevelLabel} />
          <ProfileRow label={t('profile.mainGoal')} value={goalLabel} />
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
          <ProfileRow label={t('profile.dietType')} value={dietLabel} />
          <ProfileRow label={t('profile.allergies')} value={allergyDisplay} />
        </CardContent>
      </Card>
    </>
  );
}

interface ProfileRowProps {
  label: string;
  value?: string | ReactNode | null;
}

function ProfileRow({ label, value }: Readonly<ProfileRowProps>) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-right leading-snug">
        {value ?? <span className="text-muted-foreground/60">--</span>}
      </span>
    </div>
  );
}
