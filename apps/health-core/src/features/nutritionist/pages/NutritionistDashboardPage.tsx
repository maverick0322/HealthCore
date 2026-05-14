import { useTranslation } from "react-i18next";
import { 
  Users, 
  CalendarDays, 
  ClipboardList, 
  ChevronRight,
  Video,
  MapPin,
  Clock,
  CheckCircle2
} from "lucide-react";

import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { clinicalApi } from "@/features/clinical/services/clinicalService";
import { useEffect, useState } from "react";

// ── Dummy data ─────────────────────────────────────────────────────────────

const DUMMY_STATS = {
  activePatients: 45,
  appointmentsToday: 6,
  pendingReviews: 3,
};

const DUMMY_AGENDA = [
  { id: "1", patientName: "Carlos Gómez", time: "09:00", type: "presential", status: "completed" },
  { id: "2", patientName: "María López", time: "10:30", type: "online", status: "confirmed" },
  { id: "3", patientName: "Javier Ruiz", time: "12:00", type: "online", status: "confirmed" },
  { id: "4", patientName: "Lucía Fernández", time: "15:00", type: "presential", status: "pending" },
];

// ── Main Component ─────────────────────────────────────────────────────────

export const NutritionistDashboardPage = () => {
  const { t } = useTranslation("nutritionist");
  const [displayName, setDisplayName] = useState("Profesional");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await clinicalApi.getMyNutritionistProfile();
        if (profile.fullName) {
          setDisplayName(profile.fullName.split(" ")[0] ?? profile.fullName);
        }
      } catch {
        setDisplayName("Profesional");
      }
    };

    void loadProfile();
  }, []);

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

      {/* ── Top Controls ─────────────────────────────────────────── */}
      <div className="md:pl-56">
        <SettingsBar />
      </div>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex items-start sm:items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t("dashboard.greeting", { name: displayName })}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("dashboard.greetingSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.activePatients")}
              </CardTitle>
              <Users size={16} className="text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{DUMMY_STATS.activePatients}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.appointmentsToday")}
              </CardTitle>
              <CalendarDays size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{DUMMY_STATS.appointmentsToday}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.pendingReviews")}
              </CardTitle>
              <ClipboardList size={16} className="text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{DUMMY_STATS.pendingReviews}</div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Today's Agenda */}
          <Card className="lg:col-span-1 shadow-sm border-border/50 overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20 pb-4 border-b border-border/50">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CalendarDays size={18} className="text-primary" />
                  {t("dashboard.nextAppointments")}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Revisa tus compromisos para hoy
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-primary -mr-2">
                {t("dashboard.viewAll")} <ChevronRight size={14} className="ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {DUMMY_AGENDA.length > 0 ? (
                  DUMMY_AGENDA.map((appointment) => (
                    <div 
                      key={appointment.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        {/* Time Bubble */}
                        <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center flex-shrink-0">
                          <Clock size={14} className="text-primary mb-0.5" />
                          <span className="text-xs font-bold text-primary">{appointment.time}</span>
                        </div>
                        {/* Patient Info */}
                        <div>
                          <p className="font-bold text-sm group-hover:text-primary transition-colors">
                            {appointment.patientName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              {appointment.type === "online" ? <Video size={12} /> : <MapPin size={12} />}
                              {appointment.type === "online" ? "Online" : "Presencial"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 mt-2 sm:mt-0 pl-18 sm:pl-0">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(appointment.status)}`}>
                          {t(`dashboard.status.${appointment.status}`)}
                        </span>
                        {appointment.status === "completed" && (
                          <CheckCircle2 size={14} className="text-emerald-500 hidden sm:block" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <CalendarDays size={32} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">{t("dashboard.noAppointments")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Alerts or Activity */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ClipboardList size={18} className="text-amber-500" />
                  {t("dashboard.recentActivity")}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Alertas y tareas pendientes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 text-sm">
                  {/* Dummy Alerts */}
                  <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-700 dark:text-amber-400">Revisión de plan pendiente</p>
                      <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">Carlos Gómez (Semana 4)</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-start gap-3">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-primary">Nuevo paciente asignado</p>
                      <p className="text-xs text-primary/80 mt-0.5">Ana Silva completó su onboarding</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

      </main>
    </div>
  );
};
