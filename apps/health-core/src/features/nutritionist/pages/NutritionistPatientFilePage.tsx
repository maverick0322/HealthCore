import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, User, Ruler, Weight, Flame, UtensilsCrossed, CalendarDays, FileText, CheckCircle2 } from "lucide-react";

import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

export const NutritionistPatientFilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("nutritionist");
  
  const [activeTab, setActiveTab] = useState<"overview" | "plan" | "history">("overview");

  // Dummy patient data based on ID (normally fetched from API)
  const patient = {
    id,
    name: id === "1" ? "Carlos Gómez" : id === "2" ? "María López" : "Paciente Demo",
    age: 28,
    weight: 75.5,
    height: 1.78,
    objective: "Pérdida de peso (-5kg)",
    status: "active",
    planId: "PLAN-A1",
    lastUpdate: "Hace 2 días",
    notes: [
      { date: "24-Abr-2026", content: "Paciente reporta sentir menos ansiedad por las tardes. Se ajustaron los snacks." },
      { date: "10-Abr-2026", content: "Inicio de plan. Motivación alta." }
    ]
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <NutritionistNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      {/* Header Profile Section */}
      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex flex-col">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/patients/nutritionist")}
            className="w-fit mb-4 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            {t("patients.file.back")}
          </Button>
          
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-lg border-4 border-background">
              {patient.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {patient.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={12} /> Activo
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  ID: {patient.id?.padStart(4, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Custom Tabs */}
          <div className="flex items-center gap-6 mt-8 overflow-x-auto hide-scrollbar border-b border-border/50 pb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("patients.file.tabOverview")}
            </button>
            <button
              onClick={() => setActiveTab("plan")}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "plan" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("patients.file.tabPlan")}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("patients.file.tabHistory")}
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <User size={18} className="text-primary" /> Datos Antropométricos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                    <CalendarDays size={18} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">{t("patients.file.age")}</p>
                    <p className="text-lg font-bold">{patient.age} años</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                    <Weight size={18} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">{t("patients.file.weight")}</p>
                    <p className="text-lg font-bold">{patient.weight} kg</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                    <Ruler size={18} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">{t("patients.file.height")}</p>
                    <p className="text-lg font-bold">{patient.height} m</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center flex flex-col justify-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">IMC</p>
                    <p className="text-xl font-bold text-primary">{(patient.weight / (patient.height * patient.height)).toFixed(1)}</p>
                  </div>
                </div>

                <div className="mt-6 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 flex items-start gap-3">
                  <Flame size={20} className="text-amber-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-1">{t("patients.file.objective")}</h4>
                    <p className="text-amber-600/90 dark:text-amber-400/90 text-sm">{patient.objective}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText size={18} className="text-primary" /> Resumen de Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Plan Actual</p>
                  <p className="font-semibold text-sm">Dieta Hipo {patient.planId}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Actualizado: {patient.lastUpdate}</p>
                </div>
                <Button className="w-full" size="sm" onClick={() => setActiveTab("plan")}>
                  Ver Plan Detallado
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "plan" && (
          <Card>
             <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <UtensilsCrossed size={18} className="text-primary" /> Distribución Actual
                </CardTitle>
                <Button variant="outline" size="sm" className="h-8">
                  {t("patients.file.editPlan")}
                </Button>
              </CardHeader>
              <CardContent className="pt-8 pb-12 flex flex-col items-center justify-center text-muted-foreground min-h-[300px]">
                 <UtensilsCrossed size={48} className="mb-4 opacity-20" />
                 <p className="text-sm font-medium">Aquí iría el editor de dietas o el plan asignado.</p>
                 <p className="text-xs opacity-70 mt-1">Conecta con los macros y menú del paciente.</p>
              </CardContent>
          </Card>
        )}

        {activeTab === "history" && (
          <Card>
             <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText size={18} className="text-primary" /> Historial de Consultas
                </CardTitle>
                <Button size="sm" className="h-8">
                  {t("patients.file.newNote")}
                </Button>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="relative border-l-2 border-border/50 ml-3 space-y-6">
                  {patient.notes.map((note, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary" />
                      <p className="text-xs font-bold text-muted-foreground mb-1">{note.date}</p>
                      <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm text-foreground/90 leading-relaxed">
                        {note.content}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
};
