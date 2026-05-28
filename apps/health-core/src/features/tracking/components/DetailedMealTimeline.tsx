import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { AlertCircle, Apple, Coffee, Loader2, Plus, Utensils, ImageOff } from 'lucide-react';
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
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('patient');

  const formatSafeLocalTime = (value: string) => {
    if (!value) {
      return '--:--';
    }

    const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'es-MX';
    return parsed.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getMealLabel = (mealType: string) =>
    String(
      t(`nutritionPlan.mealSlots.${mealType}`, {
        defaultValue: t(mealType.toLowerCase(), { defaultValue: mealType }),
      })
    );

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'BREAKFAST': return <Coffee className="text-emerald-700" size={16} />;
      case 'SNACK': return <Apple className="text-emerald-700" size={16} />;
      default: return <Utensils className="text-emerald-700" size={16} />;
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

    // NUEVO: Diseño de error actualizado con i18n
    if (error) {
      return (
        <div className="mt-8 mb-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-10 text-center text-sm text-destructive">
          <AlertCircle size={32} className="opacity-80 mb-2" />
          <span className="font-semibold text-base">{t('errors.loadFailed', 'No pudimos cargar tus registros.')}</span>
          <span className="text-xs opacity-80 max-w-xs">{t('errors.tryAgainLater', 'El servicio podría estar inactivo, por favor intenta más tarde.')}</span>
        </div>
      );
    }

    if (logs.length === 0) {
      return (
        <p className="mt-4 rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          {emptyMessage ?? t('dashboard.noMealsToday', 'No hay registros para este día.')}
        </p>
      );
    }

    return (
      <div className="relative mt-6 ml-4 space-y-8 border-l-2 border-muted/60 pb-4 md:ml-6">
        {logs.map((log) => {
          const imageUrl = log.photoKey;

          return (
            <div key={log.id} className="relative pl-8 md:pl-10">
              <div className="absolute -left-[17px] top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-background bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 shadow-sm transition-transform hover:scale-110">
                {getMealIcon(log.mealType)}
              </div>

              <Card className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md group">
                <div className="flex flex-col sm:flex-row">
                  {/* --- SECCIÓN DE IMAGEN --- */}
                  <div className="relative flex h-32 shrink-0 items-center justify-center border-b border-border/50 bg-muted sm:h-auto sm:w-32 sm:border-r sm:border-b-0 overflow-hidden">
                    {imageUrl ? (
                      <>
                        <img 
                          src={imageUrl} 
                          alt={log.mealName}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<svg class="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                          }}
                        />
                      </>
                    ) : (
                      <ImageOff className="text-muted-foreground/30" size={32} />
                    )}
                  </div>

                  {/* --- SECCIÓN DE TEXTO --- */}
                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div>
                      <div className="flex items-start justify-between">
                        
                        {/* Título principal usando mealName con fallback */}
                        <h3 className="text-lg font-bold text-foreground">
                          {log.mealName || getMealLabel(log.mealType)}
                        </h3>
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center">
                          <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                            {getMealLabel(log.mealType)}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {formatSafeLocalTime(log.consumedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Lista detallada de ingredientes */}
                      <div className="mt-3 space-y-1">
                        {log.items?.map((item: any, index: number) => (
                          <div key={`${item.barcode}-${index}`} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                              <span className="text-muted-foreground">{item.foodName}</span>
                            </div>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span>{item.consumedGrams}g</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {Math.round(item.calories)} kcal
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2 border-t border-border/40 pt-4 sm:gap-4">
                      <div className="text-center">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('table.calories', 'Calorías Totales')}</p>
                        <p className="text-sm font-bold">{Math.round(log.totalCalories)}</p>
                      </div>
                      <div className="text-center">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('dashboard.protein', 'Proteína')}</p>
                        <p className="text-sm font-bold">{Math.round(log.totalProteins)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('dashboard.carbs', 'Carbo')}</p>
                        <p className="text-sm font-bold">{Math.round(log.totalCarbs)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('dashboard.fat', 'Grasas')}</p>
                        <p className="text-sm font-bold">{Math.round(log.totalFats)}g</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}

        {showAddCard && (
          <div className="relative pl-8 opacity-60 transition-opacity hover:opacity-100 md:pl-10">
            <div className="absolute -left-[17px] top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-dashed border-background bg-muted text-muted-foreground ring-1 ring-border">
              <Plus size={16} />
            </div>
            <Card 
                onClick={() => navigate('/tracking/log-food')}
                className="flex cursor-pointer items-center justify-between border-dashed border-border bg-muted/10 p-4 shadow-none sm:p-5">
              <div>
                <h3 className="text-base font-bold text-muted-foreground">Registrar nuevo alimento</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">Añade otra comida a tu historial de hoy</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background">
                <Plus size={16} className="text-muted-foreground" />
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  };

  return <div className="mt-4">{renderContent()}</div>;
};