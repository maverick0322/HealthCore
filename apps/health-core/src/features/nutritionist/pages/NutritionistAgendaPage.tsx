import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  Clock,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Search,
  RefreshCw,
} from "lucide-react";

import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { useNutritionistAppointments } from "@/features/nutritionist/hooks/useNutritionistAppointments";
import type { AppointmentResponse } from "@/features/nutritionist/types/agenda.types";

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

const todayISO = () => new Date().toISOString().slice(0, 10);

const futureISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const statusColor = (s: string) => {
  switch (s) {
    case "CONFIRMED": return "text-primary bg-primary/10 border-primary/20";
    case "ATTENDED": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    case "CANCELLED": return "text-destructive bg-destructive/10 border-destructive/20";
    default: return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  }
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "CONFIRMED":
      return <Clock size={14} className="text-primary" />;
    case "ATTENDED":
      return <CheckCircle2 size={14} className="text-emerald-500" />;
    case "CANCELLED":
      return <XCircle size={14} className="text-destructive" />;
    default:
      return <Clock size={14} className="text-amber-500" />;
  }
};

const timelineDotColor = (s: string) => {
  switch (s) {
    case "ATTENDED": return "border-emerald-500";
    case "CONFIRMED": return "border-primary";
    case "CANCELLED": return "border-destructive";
    default: return "border-amber-500";
  }
};

const timelineDotFill = (s: string) => {
  switch (s) {
    case "ATTENDED": return "bg-emerald-500";
    case "CONFIRMED": return "bg-primary";
    case "CANCELLED": return "bg-destructive";
    default: return "bg-amber-500";
  }
};

// ── Component ──────────────────────────────────────────────────────────────

export const NutritionistAgendaPage = () => {
  const { t } = useTranslation("nutritionist");
  const navigate = useNavigate();

  const { appointments, isLoading, error, fetchAppointments } = useNutritionistAppointments();

  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(futureISO(7));

  // Auto-fetch on mount
  useEffect(() => {
    const from = new Date(dateFrom).toISOString();
    const to = new Date(dateTo + "T23:59:59").toISOString();
    fetchAppointments(from, to);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    const from = new Date(dateFrom).toISOString();
    const to = new Date(dateTo + "T23:59:59").toISOString();
    fetchAppointments(from, to);
  };

  // Group appointments by date
  const grouped = appointments.reduce<Record<string, AppointmentResponse[]>>((acc, a) => {
    const key = new Date(a.startTime).toISOString().slice(0, 10);
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <NutritionistNav />

      <div className="md:pl-56"><SettingsBar /></div>

      {/* Header */}
      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div aria-hidden className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("agenda.title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("agenda.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={() => navigate("/agenda/nutritionist/availability")}>
            <Settings size={14} />
            {t("agenda.availability")}
          </Button>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Sidebar: Date Filter */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays size={18} className="text-primary" />
                  {t("agenda.selectDate")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agenda-from">{t("agenda.dateFrom")}</Label>
                  <Input id="agenda-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agenda-to">{t("agenda.dateTo")}</Label>
                  <Input id="agenda-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
                <Button id="btn-search-appointments" className="w-full" onClick={handleSearch} disabled={isLoading}>
                  {isLoading
                    ? <><Loader2 size={14} className="animate-spin mr-2" />{t("agenda.loading")}</>
                    : <><Search size={14} className="mr-2" />{t("agenda.search")}</>
                  }
                </Button>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full gap-2 lg:hidden" onClick={() => navigate("/agenda/nutritionist/availability")}>
              <Settings size={16} />
              {t("agenda.availability")}
            </Button>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                {t("agenda.itinerary")}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleSearch} disabled={isLoading}>
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              </Button>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">{t("agenda.loading")}</span>
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                <AlertCircle size={28} className="text-destructive/60" />
                <p className="text-sm">{error}</p>
                <Button size="sm" variant="outline" onClick={handleSearch}>{t("agenda.retry")}</Button>
              </div>
            )}

            {/* Empty */}
            {!isLoading && !error && appointments.length === 0 && (
              <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl border-border bg-muted/10">
                <CalendarDays size={40} className="mx-auto mb-4 opacity-20" />
                <h3 className="font-bold text-foreground mb-1">{t("agenda.noAppointments")}</h3>
              </div>
            )}

            {/* Timeline List */}
            {!isLoading && !error && Object.keys(grouped).length > 0 && (
              <div className="space-y-8">
                {Object.entries(grouped)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dateKey, dayAppts]) => (
                    <div key={dateKey}>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/40 pb-2">
                        {fmtDate(dateKey + "T00:00:00")}
                      </p>
                      <div className="relative border-l-2 border-border/50 ml-4 sm:ml-6 space-y-6">
                        {dayAppts
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((apt) => (
                            <div key={apt.id} className="relative pl-6 sm:pl-8">
                              {/* Timeline dot */}
                              <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-background border-[3px] flex items-center justify-center ${timelineDotColor(apt.status)}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${timelineDotFill(apt.status)}`} />
                              </div>

                              <Card className="hover:border-primary/30 transition-colors group">
                                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-muted-foreground">
                                        {fmtTime(apt.startTime)} – {fmtTime(apt.endTime)}
                                      </span>
                                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusColor(apt.status)}`}>
                                        <StatusIcon status={apt.status} />
                                        {t(`agenda.status.${apt.status}`)}
                                      </span>
                                    </div>
                                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors mt-1">
                                      {t("dashboard.patient")}: {apt.patientId}
                                    </h3>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
