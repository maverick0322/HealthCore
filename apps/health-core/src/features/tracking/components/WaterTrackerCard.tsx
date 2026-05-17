import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Droplet, Plus } from "lucide-react";

interface WaterTrackerCardProps {
  totalWaterMl: number;
  onAddWater: (ml: number) => void;
  goalMl?: number;
}

export const WaterTrackerCard = ({ totalWaterMl, onAddWater, goalMl = 2000 }: WaterTrackerCardProps) => {
  const glassesCount = Math.floor(totalWaterMl / 250); // Glasses of water 250 ml
  const goalGlasses = Math.floor(goalMl / 250);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Droplet size={16} className="text-blue-500" /> AGUA
        </CardTitle>
        <span className="text-xs text-muted-foreground">Meta: {goalGlasses}</span>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-3xl font-bold">{glassesCount}</div>
        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onAddWater(250)}>
          <Plus size={16} />
        </Button>
      </CardContent>
    </Card>
  );
};