import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  CalendarDays, 
  Clock, 
  Plus, 
  Settings, 
  Video, 
  MapPin, 
  MoreVertical,
  CheckCircle2
} from "lucide-react";

import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

// ── Dummy Data ─────────────────────────────────────────────────────────────

const DATES = [
  { day: "Lun", date: 20, isToday: false },
  { day: "Mar", date: 21, isToday: false },
  { day: "Mié", date: 22, isToday: false },
  { day: "Jue", date: 23, isToday: false },
  { day: "Vie", date: 24, isToday: true },
  { day: "Sáb", date: 25, isToday: false },
  { day: "Dom", date: 26, isToday: false },
];

const APPOINTMENTS_DB: Record<number, any[]> = {
  24: [
    { id: "1", patientName: "Carlos Gómez", time: "09:00 - 10:00", type: "presential", status: "completed", notes: "Revisión mensual" },
    { id: "2", patientName: "María López", time: "10:30 - 11:30", type: "online", status: "confirmed", notes: "Primera consulta" },
    { id: "3", patientName: "Javier Ruiz", time: "12:00 - 12:45", type: "online", status: "confirmed", notes: "Ajuste de macros" },
    { id: "4", patientName: "Lucía Fernández", time: "15:00 - 16:00", type: "presential", status: "pending", notes: "Pesaje" },
  ],
  25: [
    { id: "5", patientName: "Roberto Ramos", time: "09:00 - 09:45", type: "presential", status: "confirmed", notes: "" },
    { id: "6", patientName: "Ana Silva", time: "11:00 - 12:00", type: "online", status: "pending", notes: "Dudas sobre el plan" },
  ],
};

// ── Main Component ─────────────────────────────────────────────────────────

export const NutritionistAgendaPage = () => {
  const { t } = useTranslation("nutritionist");
  const [selectedDate, setSelectedDate] = useState<number>(24);

  const currentAppointments = APPOINTMENTS_DB[selectedDate] || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "confirmed": return "text-primary bg-primary/10 border-primary/20";
      case "pending": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      default: return "text-muted-foreground bg-muted border-border";
    }
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t("agenda.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("agenda.subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 rounded-full">
              <Settings size={14} />
              {t("agenda.availability")}
            </Button>
            <Button size="sm" className="gap-1.5 rounded-full">
              <Plus size={14} />
              {t("agenda.newAppointment")}
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Calendar Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays size={18} className="text-primary" /> Abril 2026
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-7 gap-1">
                  {DATES.map((d, i) => (
                    <div 
                      key={i}
                      onClick={() => setSelectedDate(d.date)}
                      className={`flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl cursor-pointer transition-all duration-200 border
                        ${selectedDate === d.date 
                          ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20" 
                          : "hover:bg-muted border-transparent text-muted-foreground hover:text-foreground"
                        }
                      `}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">{d.day}</span>
                      <span className={`text-base sm:text-lg font-bold ${d.isToday && selectedDate !== d.date ? "text-primary" : ""}`}>
                        {d.date}
                      </span>
                      {d.isToday && <span className={`w-1 h-1 rounded-full mt-1 ${selectedDate === d.date ? "bg-primary-foreground" : "bg-primary"}`} />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full gap-2 lg:hidden">
              <Settings size={16} />
              {t("agenda.availability")}
            </Button>
          </div>

          {/* Timeline View */}
          <div className="lg:col-span-8">
            <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
              <Clock size={18} className="text-primary" /> 
              Itinerario del día {selectedDate}
            </h2>

            {currentAppointments.length > 0 ? (
              <div className="relative border-l-2 border-border/50 ml-4 sm:ml-6 space-y-6">
                {currentAppointments.map((apt) => (
                  <div key={apt.id} className="relative pl-6 sm:pl-8">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-background border-[3px] flex items-center justify-center
                      ${apt.status === "completed" ? "border-emerald-500" : apt.status === "confirmed" ? "border-primary" : "border-amber-500"}
                    `}>
                      <div className={`w-1.5 h-1.5 rounded-full ${apt.status === "completed" ? "bg-emerald-500" : apt.status === "confirmed" ? "bg-primary" : "bg-amber-500"}`} />
                    </div>

                    <Card className="hover:border-primary/30 transition-colors group">
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-muted-foreground">
                              {apt.time}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(apt.status)}`}>
                              {t(`dashboard.status.${apt.status}`)}
                            </span>
                          </div>
                          <h3 className="text-base font-bold group-hover:text-primary transition-colors mt-1">
                            {apt.patientName}
                          </h3>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
                              {apt.type === "online" ? <Video size={12} /> : <MapPin size={12} />}
                              {t(`agenda.details.${apt.type}`)}
                            </span>
                            {apt.notes && (
                              <span className="truncate">
                                • {apt.notes}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:border-l border-border/50 sm:pl-4 pt-3 sm:pt-0 border-t sm:border-t-0">
                          {apt.status === "pending" && (
                            <Button size="sm" variant="outline" className="h-8 text-xs bg-emerald-500/5 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10">
                              Confirmar
                            </Button>
                          )}
                          {apt.status !== "completed" && (
                            <>
                              <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive hover:bg-destructive/10">
                                Cancelar
                              </Button>
                              <Button size="sm" className="h-8 text-xs">
                                Iniciar
                              </Button>
                            </>
                          )}
                          {apt.status === "completed" && (
                            <span className="flex items-center gap-1.5 text-emerald-500 text-sm font-semibold">
                              <CheckCircle2 size={16} /> Completada
                            </span>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground ml-auto sm:ml-0">
                            <MoreVertical size={16} />
                          </Button>
                        </div>
                        
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl border-border bg-muted/10">
                <CalendarDays size={40} className="mx-auto mb-4 opacity-20" />
                <h3 className="font-bold text-foreground mb-1">{t("agenda.noAppointments")}</h3>
                <p className="text-sm">Aprovecha el tiempo libre o ajusta tu disponibilidad.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};
