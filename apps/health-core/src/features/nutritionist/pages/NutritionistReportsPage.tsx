import { useTranslation } from "react-i18next";
import { Download, FileText, Users, Activity, FileSpreadsheet, Search } from "lucide-react";
import { useState } from "react";

import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

// ── Dummy Data ─────────────────────────────────────────────────────────────

const REPORTS_DATA = {
  activePatients: 45,
  consultations: 124,
  reportsGenerated: 32,
};

const PATIENTS_EXPORT_LIST = [
  { id: "1", name: "Carlos Gómez", lastUpdate: "24-Abr-2026" },
  { id: "2", name: "María López", lastUpdate: "22-Abr-2026" },
  { id: "3", name: "Javier Ruiz", lastUpdate: "15-Abr-2026" },
  { id: "4", name: "Ana Silva", lastUpdate: "10-Abr-2026" },
  { id: "5", name: "Roberto Ramos", lastUpdate: "05-Abr-2026" },
];

export const NutritionistReportsPage = () => {
  const { t } = useTranslation("nutritionist");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = PATIENTS_EXPORT_LIST.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t("reports.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("reports.subtitle")}
          </p>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary">
                {t("reports.activePatients")}
              </CardTitle>
              <Users size={16} className="text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{REPORTS_DATA.activePatients}</div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {t("reports.consultations")}
              </CardTitle>
              <Activity size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{REPORTS_DATA.consultations}</div>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {t("reports.reportsGenerated")}
              </CardTitle>
              <FileText size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{REPORTS_DATA.reportsGenerated}</div>
            </CardContent>
          </Card>
        </div>

        {/* Export Section */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Download size={18} className="text-primary" />
                  {t("reports.exportTitle")}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {t("reports.exportDesc")}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-muted-foreground" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar paciente..."
                  className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 ring-primary transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {filteredPatients.map((patient) => (
                <div 
                  key={patient.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">
                        {patient.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Última actualización: {patient.lastUpdate}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 w-full sm:w-auto">
                      <FileText size={14} />
                      {t("reports.downloadPdf")}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 w-full sm:w-auto text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-border">
                      <FileSpreadsheet size={14} />
                      {t("reports.downloadCsv")}
                    </Button>
                  </div>
                </div>
              ))}

              {filteredPatients.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">No se encontraron pacientes para exportar.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
};
