import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
<<<<<<< HEAD
import { useWeightHistory, transformWeightDataForChart } from '../hooks/useWeightHistory';
=======
import { useWeightHistory } from '../hooks/useWeightHistory';
>>>>>>> 1e269106be8f6c59c44dbcc92a744531adcdf4dc

/**
 * WeightChart Component
 *
 * Displays the user's weight evolution over time using a simple bar chart.
 * Fetches data from the weight history API.
 *
 * States:
 * - Loading: Shows skeleton loader
 * - Error: Shows error message with retry button
 * - Empty: Shows message when no weight records exist
 * - Success: Shows the chart with weight data
 */
export const WeightChart = () => {
  const { t } = useTranslation('patient');
  const { isLoading, isError, data, refetch } = useWeightHistory();

<<<<<<< HEAD
  const chartData = useMemo(() => transformWeightDataForChart(data), [data]);

=======
>>>>>>> 1e269106be8f6c59c44dbcc92a744531adcdf4dc
  // Calculate statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return { start: 0, current: 0, min: 0, max: 0, diff: 0 };
    }

    const start = data[0].weightKg;
    const current = data[data.length - 1].weightKg;
    const min = Math.min(...data.map((r) => r.weightKg));
    const max = Math.max(...data.map((r) => r.weightKg));
    const diff = start - current;

    return { start, current, min, max, diff };
  }, [data]);

  if (isLoading) {
    return (
      <Card id="card-weight">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingDown size={16} className="text-primary" />
            {t('dashboard.weightEvolution')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1.5 h-16 mb-4">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-muted animate-pulse"
                style={{ height: `${30 + Math.random() * 30}px` }}
              />
            ))}
          </div>
          <div className="h-4 bg-muted rounded animate-pulse mt-4" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data || data.length === 0) {
    return (
      <Card id="card-weight">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingDown size={16} className="text-primary" />
            {t('dashboard.weightEvolution')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground text-sm mb-3">
              {isError
                ? t('dashboard.weightErrorMessage')
                : t('dashboard.noWeightData')}
            </p>
            {isError && (
              <button
                onClick={() => refetch()}
                className="text-primary text-sm font-medium hover:underline"
              >
                {t('common.retry')}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="card-weight">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingDown size={16} className="text-primary" />
          {t('dashboard.weightEvolution')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mini bar chart */}
        <div className="flex items-end gap-1.5 h-16 mb-4">
          {data.map((record, i) => {
            const heightPct =
              stats.max === stats.min
                ? 50
                : ((record.weightKg - stats.min) / (stats.max - stats.min)) * 100;
            const barH = Math.max(8, (1 - heightPct / 100) * 60 + 8);
            const isLast = i === data.length - 1;

            return (
              <div
                key={i}
                className={`flex-1 rounded-t-sm transition-all duration-500 ${
                  isLast ? 'bg-primary' : 'bg-primary/30'
                }`}
                style={{ height: `${barH}px` }}
                title={`${record.date}: ${record.weightKg} kg`}
              />
            );
          })}
        </div>

        {/* Statistics */}
        <div className="flex justify-between text-sm">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">
              {t('dashboard.startWeight')}
            </p>
            <p className="font-bold">{stats.start.toFixed(1)} kg</p>
          </div>

          <div className="space-y-0.5 text-center">
            <p className="text-xs text-muted-foreground">
              {t('dashboard.currentWeight')}
            </p>
            <p className="font-bold text-primary">{stats.current.toFixed(1)} kg</p>
            {stats.diff > 0 && (
              <p className="text-xs text-emerald-500 font-semibold">
                {t('dashboard.weightLost', { value: stats.diff.toFixed(1) })}
              </p>
            )}
          </div>

          <div className="space-y-0.5 text-right">
            <p className="text-xs text-muted-foreground">
              {t('dashboard.minWeight')}
            </p>
            <p className="font-bold">{stats.min.toFixed(1)} kg</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
