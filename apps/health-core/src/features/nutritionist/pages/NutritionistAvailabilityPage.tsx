import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Clock, Check } from "lucide-react";

import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const NutritionistAvailabilityPage = () => {
  const { t } = useTranslation("nutritionist");
  const navigate = useNavigate();

  // Dummy state: mapped day string to array of shifts
  const [availability, setAvailability] = useState<Record<string, { id: number; start: string; end: string }[]>>({
    monday: [{ id: 1, start: "09:00", end: "13:00" }, { id: 2, start: "15:00", end: "18:00" }],
    tuesday: [{ id: 3, start: "09:00", end: "13:00" }, { id: 4, start: "15:00", end: "18:00" }],
    wednesday: [{ id: 5, start: "09:00", end: "14:00" }],
    thursday: [{ id: 6, start: "09:00", end: "13:00" }, { id: 7, start: "15:00", end: "18:00" }],
    friday: [{ id: 8, start: "09:00", end: "15:00" }],
    saturday: [],
    sunday: [],
  });

  const handleAddShift = (day: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: [...prev[day], { id: Date.now(), start: "09:00", end: "17:00" }]
    }));
  };

  const handleRemoveShift = (day: string, id: number) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: prev[day].filter((shift) => shift.id !== id)
    }));
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <NutritionistNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex flex-col">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/agenda/nutritionist")}
            className="w-fit mb-4 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            Volver a Agenda
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {t("availability.title")}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("availability.subtitle")}
              </p>
            </div>
            <Button className="gap-2">
              <Check size={16} />
              {t("availability.save")}
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pl-56 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-0 divide-y divide-border/50">
            {DAYS_OF_WEEK.map((day) => {
              const shifts = availability[day];
              const isActive = shifts.length > 0;

              return (
                <div key={day} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-4">
                  
                  {/* Day Toggle Area */}
                  <div className="w-full sm:w-32 flex items-center justify-between sm:justify-start gap-3 flex-shrink-0 pt-1">
                    <div 
                      className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${isActive ? "bg-primary" : "bg-muted-foreground/30"}`}
                      onClick={() => {
                        if (isActive) {
                          setAvailability(prev => ({ ...prev, [day]: [] }));
                        } else {
                          handleAddShift(day);
                        }
                      }}
                    >
                      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                    <span className={`font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {t(`availability.days.${day}`)}
                    </span>
                  </div>

                  {/* Shifts Area */}
                  <div className="flex-1 space-y-3">
                    {isActive ? (
                      <>
                        {shifts.map((shift) => (
                          <div key={shift.id} className="flex items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-lg px-3 py-1.5 w-full sm:w-auto">
                              <Clock size={14} className="text-muted-foreground" />
                              <input 
                                type="time" 
                                defaultValue={shift.start} 
                                className="bg-transparent border-none text-sm font-medium outline-none text-center"
                              />
                              <span className="text-muted-foreground">-</span>
                              <input 
                                type="time" 
                                defaultValue={shift.end} 
                                className="bg-transparent border-none text-sm font-medium outline-none text-center"
                              />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemoveShift(day, shift.id)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ))}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleAddShift(day)}
                          className="text-primary hover:bg-primary/10 -ml-2 text-xs h-8"
                        >
                          <Plus size={14} className="mr-1" />
                          {t("availability.addShift")}
                        </Button>
                      </>
                    ) : (
                      <div className="h-9 flex items-center text-sm text-muted-foreground">
                        No disponible
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
