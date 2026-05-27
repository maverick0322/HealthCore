import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Droplet, Plus, Loader2, AlertCircle } from "lucide-react"; 
import { useTranslation } from "react-i18next"; 

interface WaterTrackerCardProps {
  totalWaterMl: number;
  onAddWater: (ml: number) => void;
  goalMl?: number;
  isLoading?: boolean; 
  error?: string | null;
}

export const WaterTrackerCard = ({ 
  totalWaterMl, 
  onAddWater, 
  goalMl = 2000, 
  isLoading, 
  error 
}: WaterTrackerCardProps) => {
  const { t } = useTranslation("tracking");
  
  const glassesCount = Math.floor(totalWaterMl / 250);
  const goalGlasses = Math.floor(goalMl / 250);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Droplet size={16} className="text-blue-500" /> {t('dashboard.water', 'Agua')}
        </CardTitle>
        <span className="text-xs text-muted-foreground">{t('dashboard.goal', 'Meta')}: {goalGlasses}</span>
      </CardHeader>
      
      <CardContent className="flex items-center justify-between min-h-[48px]">
        {/* NUEVO: Manejo de estados de carga y error */}
        {isLoading ? (
          <div className="flex w-full justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle size={16} />
            <span className="text-xs font-medium">{t('errors.connection', 'Error de red')}</span>
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold">{glassesCount}</div>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onAddWater(250)}>
              <Plus size={16} />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};