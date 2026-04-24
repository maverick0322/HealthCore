import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Filter, ChevronRight, User } from "lucide-react";

import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

// ── Dummy Data ─────────────────────────────────────────────────────────────

const DUMMY_PATIENTS = [
  { id: "1", name: "Carlos Gómez", status: "active", lastVisit: "24-Abr-2026", goal: "Pérdida de peso" },
  { id: "2", name: "María López", status: "pendingReview", lastVisit: "22-Abr-2026", goal: "Aumento masa muscular" },
  { id: "3", name: "Javier Ruiz", status: "active", lastVisit: "15-Abr-2026", goal: "Mantenimiento" },
  { id: "4", name: "Ana Silva", status: "pendingReview", lastVisit: "Nuevo", goal: "Pérdida de peso" },
  { id: "5", name: "Roberto Ramos", status: "active", lastVisit: "10-Abr-2026", goal: "Rendimiento deportivo" },
];

export const NutritionistPatientsPage = () => {
  const { t } = useTranslation("nutritionist");
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "pendingReview">("all");

  const filteredPatients = DUMMY_PATIENTS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    if (status === "pendingReview") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
          {t("patients.filters.pendingReview")}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
        {t("patients.filters.active")}
      </span>
    );
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex items-start sm:items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t("patients.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("patients.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder={t("patients.searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 ring-primary transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <Filter size={16} className="text-muted-foreground mr-1 hidden sm:block" />
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
              className="rounded-full"
            >
              {t("patients.filters.all")}
            </Button>
            <Button
              variant={filterStatus === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("active")}
              className="rounded-full"
            >
              {t("patients.filters.active")}
            </Button>
            <Button
              variant={filterStatus === "pendingReview" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("pendingReview")}
              className="rounded-full whitespace-nowrap"
            >
              {t("patients.filters.pendingReview")}
            </Button>
          </div>
        </div>

        {/* Patient List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <Card 
              key={patient.id} 
              className="p-4 sm:p-5 flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => navigate(`/patients/nutritionist/${patient.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base group-hover:text-primary transition-colors">
                      {patient.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {patient.goal}
                    </p>
                  </div>
                </div>
                {getStatusBadge(patient.status)}
              </div>
              
              <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("patients.lastVisit", { date: patient.lastVisit })}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary group-hover:bg-primary/10">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </Card>
          ))}
          
          {filteredPatients.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl border-border">
              <User size={32} className="mx-auto mb-3 opacity-20" />
              <p>No se encontraron pacientes.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};
