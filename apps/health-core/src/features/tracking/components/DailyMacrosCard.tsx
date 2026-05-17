import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Loader2 } from "lucide-react";
import type { TodayDashboardSummary } from "../types/tracking.types";

interface DailyMacrosCardProps {
  summary: TodayDashboardSummary | null;
  isLoading: boolean;
  goalCalories?: number; // Injected from Clinical servcice
}

export const DailyMacrosCard = ({ summary, isLoading, goalCalories = 2100 }: DailyMacrosCardProps) => {
  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[200px]">
        <Loader2 className="animate-spin text-primary" />
      </Card>
    );
  }

  const currentCalories = summary?.totalCalories ?? 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Calorías y Macros</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        {/* Aquí iría tu componente de anillo circular (ej. un SVG o librería) */}
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-primary/20">
           <div className="text-center">
             <span className="text-2xl font-bold">{currentCalories}</span>
             <span className="block text-xs text-muted-foreground">de {goalCalories} kcal</span>
           </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <div className="flex justify-between text-sm">
              <span>Proteínas</span>
              <span className="font-medium">{summary?.totalProteins ?? 0}g</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted mt-1" />
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span>Carbohidratos</span>
              <span className="font-medium">{summary?.totalCarbs ?? 0}g</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};