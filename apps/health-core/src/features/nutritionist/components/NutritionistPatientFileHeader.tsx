import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileDown, Loader2, UserMinus } from 'lucide-react';

import type { NutritionistPatientProfileResponse } from '@/features/clinical/types/clinical.types';
import { ProfileAvatar } from '@/shared/components/ProfileAvatar';
import { Button } from '@/shared/ui/button';

interface NutritionistPatientFileHeaderProps {
  patient: NutritionistPatientProfileResponse | null;
  patientIdentity: string;
  isLoadingPatient: boolean;
  isExportingPdf: boolean;
  onBack: () => void;
  onUnlink: () => void;
  onExportPdf: () => void;
}

export function NutritionistPatientFileHeader({
  patient,
  patientIdentity,
  isLoadingPatient,
  isExportingPdf,
  onBack,
  onUnlink,
  onExportPdf,
}: Readonly<NutritionistPatientFileHeaderProps>) {
  const { t } = useTranslation('nutritionist');

  return (
    <div className="relative bg-primary/10 border-b border-border overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex flex-col">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="w-fit mb-4 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          {t('patients.file.back')}
        </Button>

        <div className="flex items-center gap-5">
          {isLoadingPatient && !patient ? (
            <>
              <div
                aria-hidden="true"
                className="h-20 w-20 shrink-0 rounded-full bg-foreground/10 animate-pulse"
              />
              <div className="min-w-0">
                <div
                  aria-hidden="true"
                  className="h-8 w-56 rounded-md bg-foreground/10 animate-pulse sm:h-9 sm:w-72"
                />
              </div>
            </>
          ) : (
            <>
              <ProfileAvatar
                name={patientIdentity || 'Paciente'}
                photoUrl={patient?.profilePhotoUrl}
                size="lg"
                className="shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                  {patientIdentity || t('patients.file.loading')}
                </h1>
              </div>
            </>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-3 self-start sm:self-auto">
            <Button
              variant="destructive"
              size="sm"
              onClick={onUnlink}
              className="flex items-center gap-2"
              disabled={isLoadingPatient || !patient}
            >
              <UserMinus size={16} />
              {t('patients.file.unlink')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPdf}
              className="flex items-center gap-2"
              disabled={isLoadingPatient || !patient || isExportingPdf}
            >
              {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
              {t('patients.file.downloadPdf')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
