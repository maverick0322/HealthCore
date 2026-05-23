import { useTranslation } from "react-i18next";
import { Coffee, Utensils, Apple, Loader2, Plus, AlertCircle } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { formatLocalTime } from "@/features/agenda/utils/agendaDateUtils";

interface DetailedMealTimelineProps {
  logs: any[];
  isLoading: boolean;
  error: string | null;
}

export const DetailedMealTimeline = ({ logs, isLoading, error }: DetailedMealTimelineProps) => {
  const { t } = useTranslation("patient");

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

    if (error) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-4 text-sm text-destructive mt-4">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      );
    }

    if (logs.length === 0) {
      return (
        <p className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-lg mt-4">
          No hay registros para este día.
        </p>
      );
    }

    return (
      <div className="relative border-l-2 border-muted/60 ml-4 md:ml-6 space-y-8 pb-4 mt-6">
        {logs.map((log) => {
          const foodsDescription = log.items?.map((item: any) => item.foodName).join(', ');

          return (
            <div key={log.id} className="relative pl-8 md:pl-10">
              <div className="absolute -left-[17px] top-4 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-background bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                {getMealIcon(log.mealType)}
              </div>

              <Card className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-col sm:flex-row">
                  <div className="h-32 sm:h-auto sm:w-32 bg-muted shrink-0 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-border/50">
                     <Utensils className="text-muted-foreground/30" size={32} />
                  </div>

                  <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-base text-foreground">
                          {String(t(`tracking.mealType.${log.mealType}`, { defaultValue: log.mealType }))}
                        </h3>
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatLocalTime(log.consumedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {foodsDescription}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-4 pt-4 border-t border-border/40">
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Calorías</p>
                        <p className="font-bold text-sm">{Math.round(log.totalCalories)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Proteína</p>
                        <p className="font-bold text-sm">{Math.round(log.totalProteins)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Carbo</p>
                        <p className="font-bold text-sm">{Math.round(log.totalCarbs)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Grasas</p>
                        <p className="font-bold text-sm">{Math.round(log.totalFats)}g</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}

        <div className="relative pl-8 md:pl-10 opacity-60 hover:opacity-100 transition-opacity">
          <div className="absolute -left-[17px] top-4 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-background bg-muted text-muted-foreground ring-1 ring-border border-dashed">
            <Plus size={16} />
          </div>
          <Card className="border-dashed border-border shadow-none bg-muted/10 p-4 sm:p-5 flex justify-between items-center cursor-pointer">
            <div>
              <h3 className="font-bold text-base text-muted-foreground">Registrar nuevo alimento</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Añade otra comida a tu historial de hoy</p>
            </div>
            <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center bg-background">
              <Plus size={16} className="text-muted-foreground" />
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
  <div className="mt-4">
    {renderContent()}
  </div>
);
};