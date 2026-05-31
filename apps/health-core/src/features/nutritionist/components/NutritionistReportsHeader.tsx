import { useTranslation } from 'react-i18next';
import { FileDown, Loader2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';

interface NutritionistReportsHeaderProps {
  locale: string;
  isLoading: boolean;
  isExporting: boolean;
  hasData: boolean;
  onExport: () => void;
}

export function NutritionistReportsHeader({
  locale,
  isLoading,
  isExporting,
  hasData,
  onExport,
}: Readonly<NutritionistReportsHeaderProps>) {
  const { t } = useTranslation('nutritionist');

  return (
    <div className="relative overflow-hidden border-b border-border bg-primary/10 md:pl-56">
      <div
        aria-hidden
        className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {t('reports.title')}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('reports.subtitle')}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('reports.generatedOn', {
                date: new Date().toLocaleDateString(locale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }),
              })}
            </p>
          </div>

          <Button
            type="button"
            className="gap-2 self-start"
            onClick={onExport}
            disabled={isLoading || isExporting || !hasData}
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            {isExporting ? t('reports.exportingPdf') : t('reports.exportPdf')}
          </Button>
        </div>
      </div>
    </div>
  );
}
