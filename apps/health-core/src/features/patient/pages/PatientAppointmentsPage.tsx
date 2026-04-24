import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  Clock,
  UserCircle,
  Video,
  CheckCircle2,
  Calendar,
  XCircle,
  MapPin,
  Stethoscope,
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { PatientNav } from "@/features/patient/components/PatientNav";

// ── Dummy data ─────────────────────────────────────────────────────────────

const APPOINTMENTS_DUMMY = {
  doctor: "Dra. Elena Martínez",
  specialty: "Nutrición Clínica y Deportiva",
  availableDates: [
    { date: "2026-05-28", dayName: "Jueves", day: "28", available: true },
    { date: "2026-05-29", dayName: "Viernes", day: "29", available: true },
    { date: "2026-05-30", dayName: "Sábado", day: "30", available: false },
    { date: "2026-06-01", dayName: "Lunes", day: "01", available: true },
    { date: "2026-06-02", dayName: "Martes", day: "02", available: true },
  ],
  availableTimes: ["09:00", "09:45", "11:15", "14:30", "16:00", "17:30"],
  history: [
    {
      id: "1",
      date: "14 May 2026, 10:00 AM",
      type: "online",
      status: "completed",
      notes: "Ajuste de macros para hipertrofia.",
    },
    {
      id: "2",
      date: "30 Abr 2026, 11:30 AM",
      type: "in-person",
      status: "completed",
      notes: "Evaluación inicial y composición corporal.",
    },
    {
      id: "3",
      date: "15 Abr 2026, 09:00 AM",
      type: "online",
      status: "cancelled",
      notes: "Cancelada por el paciente.",
    },
  ],
};

// ── Component ──────────────────────────────────────────────────────────────

export const PatientAppointmentsPage = () => {
  const { t } = useTranslation("patient");
  const [selectedDate, setSelectedDate] = useState<string>("2026-05-28");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={16} className="text-emerald-500" />;
      case "cancelled":
        return <XCircle size={16} className="text-destructive" />;
      default:
        return <Clock size={16} className="text-amber-500" />;
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <PatientNav />

      {/* ── Top Controls ───────────────────────────────────────── */}
      <div className="md:pl-56">
        <SettingsBar />
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t("appointments.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("appointments.subtitle")}
          </p>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-8 md:pl-56 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* Doctor Info Card */}
        <Card className="bg-card">
          <CardContent className="p-4 sm:p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <UserCircle size={32} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{t("appointments.doctor")}</p>
              <p className="font-bold text-lg">{APPOINTMENTS_DUMMY.doctor}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Stethoscope size={14} />
                <span>{APPOINTMENTS_DUMMY.specialty}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desktop grid layout for scheduling & history */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ── Column 1: Schedule New Appointment ── */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar size={18} className="text-primary" />
                  {t("appointments.scheduleNew")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                
                {/* Date Selection */}
                <div>
                  <h3 className="text-sm font-medium mb-3">{t("appointments.selectDate")}</h3>
                  <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-1 px-1">
                    {APPOINTMENTS_DUMMY.availableDates.map((d) => (
                      <button
                        key={d.date}
                        disabled={!d.available}
                        onClick={() => {
                          setSelectedDate(d.date);
                          setSelectedTime(null);
                        }}
                        className={`flex flex-col items-center min-w-[4rem] p-2 rounded-xl border transition-all ${
                          !d.available
                            ? "opacity-40 cursor-not-allowed bg-muted/30 border-transparent"
                            : selectedDate === d.date
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-card border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="text-[10px] uppercase font-semibold">{d.dayName.substring(0, 3)}</span>
                        <span className="text-lg font-bold mt-1">{d.day}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <h3 className="text-sm font-medium mb-3">{t("appointments.selectTime")}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {APPOINTMENTS_DUMMY.availableTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 rounded-lg text-sm font-medium transition-all border ${
                          selectedTime === time
                            ? "bg-primary/10 text-primary border-primary shadow-sm"
                            : "bg-background border-border hover:border-primary/50 text-foreground"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  disabled={!selectedDate || !selectedTime}
                >
                  {t("appointments.confirmAppointment")}
                </Button>

              </CardContent>
            </Card>
          </div>

          {/* ── Column 2: Appointment History ── */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  {t("appointments.history")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {APPOINTMENTS_DUMMY.history.map((app) => (
                    <div key={app.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm">{app.date}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            {app.type === "online" ? <Video size={13} /> : <MapPin size={13} />}
                            <span className="capitalize">{app.type === "online" ? "Videollamada" : "Presencial"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-background border px-2 py-1 rounded-md text-xs font-medium">
                          <StatusIcon status={app.status} />
                          <span className={
                            app.status === "completed" ? "text-emerald-500" :
                            app.status === "cancelled" ? "text-destructive" : ""
                          }>
                            {t(`appointments.status.${app.status}`)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 border-l-2 border-primary/30 pl-2">
                        {app.notes}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
};
