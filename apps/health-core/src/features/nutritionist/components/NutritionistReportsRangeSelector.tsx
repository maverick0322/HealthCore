import { useTranslation } from 'react-i18next';

import type { NutritionistReportRangeKey } from '@/features/nutritionist/types/report.types';
import { NUTRITIONIST_REPORT_RANGE_OPTIONS } from '@/features/nutritionist/utils/reporting';
import { Button } from '@/shared/ui/button';

interface NutritionistReportsRangeSelectorProps {
  rangeKey: NutritionistReportRangeKey;
  onChangeRange: (value: NutritionistReportRangeKey) => void;
}

export function NutritionistReportsRangeSelector({
  rangeKey,
  onChangeRange,
}: Readonly<NutritionistReportsRangeSelectorProps>) {
  const { t } = useTranslation('nutritionist');

  return (
    <div className="flex flex-wrap gap-2">
      {NUTRITIONIST_REPORT_RANGE_OPTIONS.map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant={rangeKey === option ? 'default' : 'outline'}
          onClick={() => onChangeRange(option)}
        >
          {t(`reports.ranges.${option}`)}
        </Button>
      ))}
    </div>
  );
}
