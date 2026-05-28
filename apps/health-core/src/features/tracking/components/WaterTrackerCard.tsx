import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Droplet, Plus, Minus, Loader2, AlertCircle } from "lucide-react"; // <-- Importamos Minus
import { useTranslation } from "react-i18next";

interface WaterTrackerCardProps {
  totalWaterMl: number;
  onAddWater: (ml: number) => void;
  onRemoveWater?: () => void; // <-- NUEVA PROP: Por si tienes una función separada para borrar
  goalMl?: number;
  isLoading?: boolean;
  error?: string | null;
}

export const WaterTrackerCard = ({
  totalWaterMl,
  onAddWater,
  onRemoveWater,
  goalMl = 2000,
  isLoading,
  error
}: WaterTrackerCardProps) => {
  const { t } = useTranslation("tracking");

  const glassesCount = Math.floor(totalWaterMl / 250); // Asumiendo vasos de 250ml
  const goalGlasses = Math.floor(goalMl / 250);

  // Array dinámico para pintar las barritas inferiores (mínimo muestra la meta)
  const progressBars = Array.from({ length: Math.max(goalGlasses, glassesCount) });

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Droplet size={16} className="text-blue-500" strokeWidth={2.5} /> 
          {t('dashboard.water', 'AGUA')}
        </CardTitle>
        <span className="text-xs font-semibold text-muted-foreground">
          {t('dashboard.goal', 'Meta')}: {goalGlasses}
        </span>
      </CardHeader>
      
      <CardContent className="flex flex-col justify-between flex-1 min-h-[90px] pt-2">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center gap-2 text-destructive">
            <AlertCircle size={16} />
            <span className="text-xs font-medium">{t('errors.connection', 'Error de red')}</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                {glassesCount}
              </div>
              
              <div className="flex items-center gap-2">
                {/* BOTÓN DE RESTAR */}
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-10 w-10 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" 
                  // Si existe onRemoveWater lo usamos, sino mandamos un valor negativo a onAddWater
                  onClick={() => onRemoveWater ? onRemoveWater() : onAddWater(-250)}
                  disabled={glassesCount === 0 || isLoading}
                >
                  <Minus size={18} strokeWidth={2.5} />
                </Button>

                {/* BOTÓN DE SUMAR */}
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-10 w-10 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400" 
                  onClick={() => onAddWater(250)}
                  disabled={isLoading}
                >
                  <Plus size={18} strokeWidth={2.5} />
                </Button>
              </div>
            </div>

            {/* INDICADORES VISUALES (BARRITAS) */}
            <div className="mt-5 flex gap-1.5 w-full">
              {progressBars.map((_, index) => {
                const isFilled = index < glassesCount;
                return (
                  <div
                    key={index}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ease-in-out ${
                      isFilled
                        ? "bg-blue-500"
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}
                  />
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};