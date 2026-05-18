import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Coffee, Sun, Utensils, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatLocalTime } from "@/features/agenda/utils/agendaDateUtils";

interface TodayMealsListProps {
  meals: any[];
  isLoading: boolean;
}

export const TodayMealsList = ({ meals, isLoading }: TodayMealsListProps) => {
  const { t } = useTranslation("patient");

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'BREAKFAST': return <Coffee className="text-amber-500" size={18} />;
      case 'LUNCH': return <Sun className="text-orange-500" size={18} />;
      default: return <Utensils className="text-primary" size={18} />;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" />
        </div>
      );
    }

    if (meals.length === 0) {
      return (
        <p className="text-center py-6 text-muted-foreground">
          Aún no has registrado alimentos hoy.
        </p>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
            <tr>
              <th className="px-4 py-3 font-medium">Alimento</th>
              <th className="px-4 py-3 font-medium text-center">Hora</th>
              <th className="px-4 py-3 font-medium text-center">Categoría</th>
              <th className="px-4 py-3 font-medium text-right">Calorías</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {meals.map((log) => (
              <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-4 flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">{getMealIcon(log.mealType)}</div>
                  <span className="font-medium">
                    {log.items?.[0]?.foodName} {log.items?.length > 1 && `+${log.items.length - 1}`}
                  </span>
                </td>
                <td className="px-4 py-4 text-center text-muted-foreground">
                  {formatLocalTime(log.consumedAt)}
                </td>
                <td className="px-4 py-4 text-center text-xs">
                  <span className="px-2 py-1 bg-muted rounded-full uppercase">
                    {t(`tracking.mealType.${log.mealType}`)}
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-bold text-primary">
                  {Math.round(log.totalCalories)} kcal
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-bold">Registro de Hoy</CardTitle>
        <button className="text-sm text-primary font-medium hover:underline">Ver historial completo</button>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};