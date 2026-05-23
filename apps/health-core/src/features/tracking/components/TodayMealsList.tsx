import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Coffee, Sun, Utensils, Loader2, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatLocalTime } from "@/features/agenda/utils/agendaDateUtils";
import type { MealLogDTO } from "../types/tracking.types";

interface TodayMealsListProps {
  meals: MealLogDTO[];
  isLoading: boolean;
}

export const TodayMealsList: React.FC<TodayMealsListProps> = ({ meals, isLoading }) => {
  const { t } = useTranslation("tracking");

  const getMealIcon = (type: MealLogDTO['mealType']) => {
    switch (type) {
      case 'BREAKFAST': return <Coffee className="text-amber-500" size={18} />;
      case 'LUNCH': return <Sun className="text-orange-500" size={18} />;
      case 'SNACK': return <Utensils className="text-purple-500" size={18} />;
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

    if (!meals || meals.length === 0) {
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
              <th className="px-4 py-3 font-medium text-center">Evidencia</th>
              <th className="px-4 py-3 font-medium text-right">Calorías</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {meals.map((log) => {
              const foodItems = log.items || [];
              
              const primaryFoodName = foodItems.length > 0 
                ? foodItems[0].foodName 
                : 'Registro sin alimentos';
                
              const extraFoodsCount = foodItems.length > 0 
                ? foodItems.length - 1 
                : 0;

              return (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-4 flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">{getMealIcon(log.mealType)}</div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate max-w-[220px]" title={primaryFoodName}>
                        {primaryFoodName}
                      </span>
                      {extraFoodsCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          + {extraFoodsCount} alimento(s)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-muted-foreground">
                    {formatLocalTime(log.consumedAt)}
                  </td>
                  <td className="px-4 py-4 text-center text-xs">
                    <span className="px-2 py-1 bg-muted rounded-full uppercase">
                      {t(`meals.${log.mealType.toLowerCase()}`, log.mealType)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {log.photoKey ? (
                      <span className="inline-flex items-center justify-center p-1.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md" title="Foto adjunta">
                        <ImageIcon size={16} />
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-700">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-primary">
                    {Math.round(log.totalCalories)} kcal
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Card className="border-none shadow-sm mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-bold">Registro de Hoy</CardTitle>
        <button className="text-sm text-primary font-medium hover:underline">Ver historial completo</button>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
};