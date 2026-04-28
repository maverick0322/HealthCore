import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  AlertCircle,
  CalendarDays,
  RefreshCw,
  CalendarCheck,
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { PatientNav } from "@/features/patient/components/PatientNav";

import { useAvailability } from "@/features/patient/hooks/useAvailability";
import { usePatientAppointments } from "@/features/patient/hooks/usePatientAppointments";
import { useCreateAppointment } from "@/features/patient/hooks/useCreateAppointment";
import { useCancelAppointment } from "@/features/patient/hooks/useCancelAppointment";
import { useRescheduleAppointment } from "@/features/patient/hooks/useRescheduleAppointment";
import type { AppointmentResponse, AvailabilitySlotResponse } from "@/features/patient/types/agenda.types";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Format an ISO date-time to a short time string (HH:mm). */
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Format an ISO date-time to a readable date string. */
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

/** Format an ISO date-time to a full date+time string. */
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString([], {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

/** Get today in YYYY-MM-DD format. */
const todayISO = () => new Date().toISOString().slice(0, 10);

/** Get a date N days from now in YYYY-MM-DD format. */
const futureISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "CONFIRMED":
    case "ATTENDED":
      return <CheckCircle2 size={14} className="text-emerald-500" />;
    case "CANCELLED":
      return <XCircle size={14} className="text-destructive" />;
    default:
      return <Clock size={14} className="text-amber-500" />;
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case "CONFIRMED":
    case "ATTENDED":
      return "text-emerald-500";
    case "CANCELLED":
      return "text-destructive";
    default:
      return "text-amber-500";
  }
};

// ── Component ──────────────────────────────────────────────────────────────

type Tab = "appointments" | "schedule";

export const PatientAppointmentsPage = () => {
  const { t } = useTranslation("patient");

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<Tab>("appointments");

  // ── Hooks ──
  const { appointments, isLoading: loadingAppts, error: apptError, fetchAppointments } = usePatientAppointments();
  const { slots, isLoading: loadingSlots, error: slotError, fetchAvailability } = useAvailability();
  const { createAppointment, isLoading: booking } = useCreateAppointment();
  const { cancelAppointment, isLoading: cancelling } = useCancelAppointment();
  const { rescheduleAppointment, isLoading: rescheduling } = useRescheduleAppointment();

  // ── Search form state ──
  const [nutritionistId, setNutritionistId] = useState("");
  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(futureISO(14));

  // ── Selected slot for booking ──
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlotResponse | null>(null);

  // ── Cancel dialog ──
  const [cancelTarget, setCancelTarget] = useState<AppointmentResponse | null>(null);

  // ── Reschedule dialog ──
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentResponse | null>(null);
  const [rescheduleSlot, setRescheduleSlot] = useState<AvailabilitySlotResponse | null>(null);

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(id);
    }
  }, [toast]);

  // ── Actions ──

  const handleSearchSlots = () => {
    if (!nutritionistId.trim()) return;
    const from = new Date(dateFrom).toISOString();
    const to = new Date(dateTo + "T23:59:59").toISOString();
    fetchAvailability(nutritionistId.trim(), from, to);
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    try {
      await createAppointment({ slotId: selectedSlot.id, slotVersion: selectedSlot.version });
      setToast({ msg: t("appointments.appointmentConfirmed"), type: "success" });
      setSelectedSlot(null);
      fetchAppointments();
      // Refresh slots to remove the booked one
      if (nutritionistId.trim()) handleSearchSlots();
    } catch {
      setToast({ msg: t("appointments.errorGeneric"), type: "error" });
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelAppointment(cancelTarget.id);
      setToast({ msg: t("appointments.appointmentCancelled"), type: "success" });
      setCancelTarget(null);
      fetchAppointments();
    } catch {
      setToast({ msg: t("appointments.errorGeneric"), type: "error" });
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleTarget || !rescheduleSlot) return;
    try {
      await rescheduleAppointment(rescheduleTarget.id, {
        newSlotId: rescheduleSlot.id,
        newSlotVersion: rescheduleSlot.version,
      });
      setToast({ msg: t("appointments.appointmentRescheduled"), type: "success" });
      setRescheduleTarget(null);
      setRescheduleSlot(null);
      fetchAppointments();
      if (nutritionistId.trim()) handleSearchSlots();
    } catch {
      setToast({ msg: t("appointments.errorGeneric"), type: "error" });
    }
  };

  // ── Group slots by date for the scheduler view ──
  const slotsByDate = slots.reduce<Record<string, AvailabilitySlotResponse[]>>((acc, s) => {
    const key = new Date(s.startTime).toISOString().slice(0, 10);
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  // ── Render ──
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <PatientNav />

      <div className="md:pl-56"><SettingsBar /></div>

      {/* Header */}
      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div aria-hidden className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("appointments.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("appointments.subtitle")}</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`md:pl-56 px-4 sm:px-6`}>
          <div className={`max-w-7xl mx-auto mt-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
              : "bg-destructive/10 text-destructive border border-destructive/25"
          }`}>
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="md:pl-56 px-4 sm:px-6 pt-4">
        <div className="max-w-7xl mx-auto flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
          {(["appointments", "schedule"] as Tab[]).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "appointments" ? t("appointments.tabMyAppointments") : t("appointments.tabSchedule")}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-8 md:pl-56 animate-in fade-in slide-in-from-bottom-2 duration-500">

        {/* ══════════ TAB: My Appointments ══════════ */}
        {activeTab === "appointments" && (
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarCheck size={18} className="text-primary" />
                  {t("appointments.tabMyAppointments")}
                </CardTitle>
                <Button id="btn-refresh-appts" variant="ghost" size="icon" onClick={fetchAppointments} disabled={loadingAppts}>
                  <RefreshCw size={16} className={loadingAppts ? "animate-spin" : ""} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAppts && (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">{t("appointments.loadingAppointments")}</span>
                </div>
              )}

              {apptError && !loadingAppts && (
                <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                  <AlertCircle size={28} className="text-destructive/60" />
                  <p className="text-sm">{apptError}</p>
                  <Button size="sm" variant="outline" onClick={fetchAppointments}>{t("appointments.retry")}</Button>
                </div>
              )}

              {!loadingAppts && !apptError && appointments.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Calendar size={32} className="opacity-40" />
                  <p className="text-sm">{t("appointments.noAppointments")}</p>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab("schedule")}>
                    {t("appointments.scheduleNew")}
                  </Button>
                </div>
              )}

              {!loadingAppts && !apptError && appointments.length > 0 && (
                <div className="divide-y divide-border/50">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{fmtDateTime(appt.startTime)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {fmtTime(appt.startTime)} – {fmtTime(appt.endTime)}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1.5 bg-background border px-2 py-1 rounded-md text-xs font-medium ${statusColor(appt.status)}`}>
                          <StatusIcon status={appt.status} />
                          {t(`appointments.status.${appt.status}`)}
                        </div>
                      </div>
                      {/* Actions for active appointments */}
                      {(appt.status === "PENDING" || appt.status === "CONFIRMED") && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            id={`btn-cancel-${appt.id}`}
                            size="sm"
                            variant="destructive"
                            className="text-xs h-7"
                            onClick={() => setCancelTarget(appt)}
                          >
                            <XCircle size={13} className="mr-1" />
                            {t("appointments.cancelBtn")}
                          </Button>
                          <Button
                            id={`btn-reschedule-${appt.id}`}
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => {
                              setRescheduleTarget(appt);
                              // Load slots for this nutritionist if we have the ID
                              if (appt.nutritionistId) {
                                setNutritionistId(appt.nutritionistId);
                                const from = new Date().toISOString();
                                const to = new Date(Date.now() + 14 * 86400000).toISOString();
                                fetchAvailability(appt.nutritionistId, from, to);
                              }
                            }}
                          >
                            <RefreshCw size={13} className="mr-1" />
                            {t("appointments.rescheduleBtn")}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ══════════ TAB: Schedule New ══════════ */}
        {activeTab === "schedule" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Search Form */}
            <Card>
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Search size={18} className="text-primary" />
                  {t("appointments.searchSlots")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="input-nutritionist-id">{t("appointments.nutritionistId")}</Label>
                  <Input
                    id="input-nutritionist-id"
                    value={nutritionistId}
                    onChange={(e) => setNutritionistId(e.target.value)}
                    placeholder={t("appointments.nutritionistIdPlaceholder")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="input-date-from">{t("appointments.dateFrom")}</Label>
                    <Input id="input-date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="input-date-to">{t("appointments.dateTo")}</Label>
                    <Input id="input-date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </div>
                <Button
                  id="btn-search-slots"
                  className="w-full"
                  onClick={handleSearchSlots}
                  disabled={!nutritionistId.trim() || loadingSlots}
                >
                  {loadingSlots ? (
                    <><Loader2 size={14} className="animate-spin mr-2" />{t("appointments.loadingSlots")}</>
                  ) : (
                    <><Search size={14} className="mr-2" />{t("appointments.searchSlots")}</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Available Slots Results */}
            <Card className="h-fit">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarDays size={18} className="text-primary" />
                  {t("appointments.selectTime")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {slotError && (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <AlertCircle size={24} className="text-destructive/60" />
                    <p className="text-sm text-center px-4">{slotError}</p>
                  </div>
                )}

                {!slotError && slots.length === 0 && !loadingSlots && (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <Calendar size={28} className="opacity-40" />
                    <p className="text-sm">{t("appointments.noAvailableTimes")}</p>
                  </div>
                )}

                {loadingSlots && (
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm">{t("appointments.loadingSlots")}</span>
                  </div>
                )}

                {!loadingSlots && !slotError && Object.keys(slotsByDate).length > 0 && (
                  <div className="divide-y divide-border/50 max-h-[420px] overflow-y-auto">
                    {Object.entries(slotsByDate)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dateKey, daySlots]) => (
                        <div key={dateKey} className="p-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            {fmtDate(dateKey + "T00:00:00")}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {daySlots
                              .sort((a, b) => a.startTime.localeCompare(b.startTime))
                              .map((slot) => {
                                const isSelected = selectedSlot?.id === slot.id;
                                return (
                                  <button
                                    key={slot.id}
                                    onClick={() => setSelectedSlot(isSelected ? null : slot)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                                      isSelected
                                        ? "bg-primary/10 text-primary border-primary shadow-sm"
                                        : "bg-background border-border hover:border-primary/50 text-foreground"
                                    }`}
                                  >
                                    {fmtTime(slot.startTime)}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Book button */}
                {selectedSlot && (
                  <div className="p-4 border-t border-border/50">
                    <div className="bg-primary/5 rounded-lg p-3 mb-3 text-sm">
                      <p className="font-medium">{fmtDate(selectedSlot.startTime)}</p>
                      <p className="text-muted-foreground">{fmtTime(selectedSlot.startTime)} – {fmtTime(selectedSlot.endTime)}</p>
                    </div>
                    <Button id="btn-book-slot" className="w-full" onClick={handleBook} disabled={booking}>
                      {booking ? (
                        <><Loader2 size={14} className="animate-spin mr-2" />{t("appointments.booking")}</>
                      ) : (
                        t("appointments.bookSlot")
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* ── Cancel Confirmation Dialog ── */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("appointments.cancelTitle")}</DialogTitle>
            <DialogDescription>{t("appointments.cancelConfirm")}</DialogDescription>
          </DialogHeader>
          {cancelTarget && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium">{fmtDateTime(cancelTarget.startTime)}</p>
              <p className="text-muted-foreground">{fmtTime(cancelTarget.startTime)} – {fmtTime(cancelTarget.endTime)}</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelTarget(null)}>{t("appointments.close")}</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? <><Loader2 size={14} className="animate-spin mr-2" />{t("appointments.cancelling")}</> : t("appointments.cancelBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reschedule Dialog ── */}
      <Dialog open={!!rescheduleTarget} onOpenChange={(open) => { if (!open) { setRescheduleTarget(null); setRescheduleSlot(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("appointments.rescheduleTitle")}</DialogTitle>
            <DialogDescription>{t("appointments.rescheduleSelectSlot")}</DialogDescription>
          </DialogHeader>

          {loadingSlots && (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">{t("appointments.loadingSlots")}</span>
            </div>
          )}

          {!loadingSlots && slots.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">{t("appointments.noAvailableTimes")}</p>
          )}

          {!loadingSlots && slots.length > 0 && (
            <div className="max-h-64 overflow-y-auto divide-y divide-border/50">
              {Object.entries(slotsByDate)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dateKey, daySlots]) => (
                  <div key={dateKey} className="py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      {fmtDate(dateKey + "T00:00:00")}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((slot) => {
                        const isSel = rescheduleSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setRescheduleSlot(isSel ? null : slot)}
                            className={`py-1.5 px-2 rounded-md text-xs font-medium transition-all border ${
                              isSel
                                ? "bg-primary/10 text-primary border-primary"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {fmtTime(slot.startTime)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRescheduleTarget(null); setRescheduleSlot(null); }}>
              {t("appointments.close")}
            </Button>
            <Button onClick={handleReschedule} disabled={!rescheduleSlot || rescheduling}>
              {rescheduling ? <><Loader2 size={14} className="animate-spin mr-2" />{t("appointments.rescheduling")}</> : t("appointments.rescheduleBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
