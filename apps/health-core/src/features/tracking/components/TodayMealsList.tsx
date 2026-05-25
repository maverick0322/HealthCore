import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Coffee, Sun, Utensils, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { MealLogDTO } from "../types/tracking.types";

interface TodayMealsListProps {
  meals: MealLogDTO[];
  isLoading: boolean;
}

export const TodayMealsList: React.FC<TodayMealsListProps> = ({ meals, isLoading }) => {
  const { t } = useTranslation("tracking");

  // --- SOLUCIÓN DE ZONA HORARIA ---
  const formatSafeLocalTime = (isoString: string) => {
    if (!isoString) return '--:--';
    // Fuerza a JavaScript a tratar la fecha como UTC antes de convertirla a hora local
    const safeIso = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
    const date = new Date(safeIso);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

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

              // La URL pre-firmada ya viene inyectada por el backend gRPC
              const imageUrl = log.photoKey;

              return (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-4 flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg shrink-0">
                      {getMealIcon(log.mealType)}
                    </div>
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
                  
                  {/* HORA SEGURA APLICADA AQUÍ */}
                  <td className="px-4 py-4 text-center text-muted-foreground whitespace-nowrap">
                    {formatSafeLocalTime(log.consumedAt)}
                  </td>
                  
                  <td className="px-4 py-4 text-center text-xs">
                    <span className="px-2 py-1 bg-muted rounded-full uppercase">
                      {t(`meals.${log.mealType.toLowerCase()}`, log.mealType)}
                    </span>
                  </td>
                  
                  {/* MINIATURA FOTOGRÁFICA RENDERIZADA */}
                  <td className="px-4 py-4 text-center">
                    {imageUrl ? (
                      <div className="mx-auto h-10 w-10 rounded-md overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800">
                        <img 
                          src={imageUrl} 
                          alt="Evidencia del platillo" 
                          className="h-full w-full object-cover"
                          loading="lazy"
                          // Fallback a ícono SVG gris si la URL pre-firmada expiró o falló
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                            e.currentTarget.parentElement!.innerHTML = '<svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                          }}
                        />
                      </div>
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