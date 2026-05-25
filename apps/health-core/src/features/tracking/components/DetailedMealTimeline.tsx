import { useTranslation } from 'react-i18next';
import { AlertCircle, Apple, Coffee, Loader2, Plus, Utensils } from 'lucide-react';

import { formatLocalTime } from '@/features/agenda/utils/agendaDateUtils';
import { Card } from '@/shared/ui/card';

interface DetailedMealTimelineProps {
  logs: any[];
  isLoading: boolean;
  error: string | null;
  emptyMessage?: string;
  showAddCard?: boolean;
}

export const DetailedMealTimeline = ({
  logs,
  isLoading,
  error,
  emptyMessage,
  showAddCard = true,
}: DetailedMealTimelineProps) => {
  const { t } = useTranslation('patient');

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'BREAKFAST':
        return <Coffee className="text-emerald-700" size={16} />;
      case 'SNACK':
        return <Apple className="text-emerald-700" size={16} />;
      default:
        return <Utensils className="text-emerald-700" size={16} />;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-4 text-sm text-destructive">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      );
    }

    if (logs.length === 0) {
      return (
        <p className="mt-4 rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          {emptyMessage ?? 'No hay registros para este día.'}
        </p>
      );
    }

    return (
      <div className="relative mt-6 ml-4 space-y-8 border-l-2 border-muted/60 pb-4 md:ml-6">
        {logs.map((log) => {
          const foodsDescription = log.items?.map((item: any) => item.foodName).join(', ');

          return (
            <div key={log.id} className="relative pl-8 md:pl-10">
              <div className="absolute -left-[17px] top-4 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-background bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                {getMealIcon(log.mealType)}
              </div>

              <Card className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-col sm:flex-row">
                  <div className="flex h-32 shrink-0 items-center justify-center border-b border-border/50 bg-muted sm:h-auto sm:w-32 sm:border-r sm:border-b-0">
                    <Utensils className="text-muted-foreground/30" size={32} />
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="text-base font-bold text-foreground">
                          {String(t(`tracking.mealType.${log.mealType}`, { defaultValue: log.mealType }))}
                        </h3>
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatLocalTime(log.consumedAt)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {foodsDescription}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2 border-t border-border/40 pt-4 sm:gap-4">
                      <div className="text-center">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Calorías
                        </p>
                        <p className="text-sm font-bold">{Math.round(log.totalCalories)}</p>
                      </div>
                      <div className="text-center">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Proteína
                        </p>
                        <p className="text-sm font-bold">{Math.round(log.totalProteins)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Carbo
                        </p>
                        <p className="text-sm font-bold">{Math.round(log.totalCarbs)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Grasas
                        </p>
                        <p className="text-sm font-bold">{Math.round(log.totalFats)}g</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}

        {showAddCard ? (
          <div className="relative pl-8 opacity-60 transition-opacity hover:opacity-100 md:pl-10">
            <div className="absolute -left-[17px] top-4 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-dashed border-background bg-muted text-muted-foreground ring-1 ring-border">
              <Plus size={16} />
            </div>
            <Card className="flex cursor-pointer items-center justify-between border-dashed border-border bg-muted/10 p-4 shadow-none sm:p-5">
              <div>
                <h3 className="text-base font-bold text-muted-foreground">Registrar nuevo alimento</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Añade otra comida a tu historial de hoy
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background">
                <Plus size={16} className="text-muted-foreground" />
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    );
  };

  return <div className="mt-4">{renderContent()}</div>;
};
