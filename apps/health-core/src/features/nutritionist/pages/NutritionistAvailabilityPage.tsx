import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Search,
  Zap,
  Trash2,
  RefreshCw,
} from "lucide-react";

import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
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

import { useGenerateSlots } from "@/features/nutritionist/hooks/useGenerateSlots";
import { useNutritionistSlots } from "@/features/nutritionist/hooks/useNutritionistSlots";
import { useDeactivateSlot } from "@/features/nutritionist/hooks/useDeactivateSlot";
import type { AvailabilitySlotResponse } from "@/features/nutritionist/types/agenda.types";

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

type Tab = "generate" | "mySlots";

// ── Component ──────────────────────────────────────────────────────────────

export const NutritionistAvailabilityPage = () => {
  const { t } = useTranslation("nutritionist");
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("generate");

  // Hooks
  const { generateSlots, isLoading: generating, error: genError, isSuccess: genSuccess, slots: generatedSlots } = useGenerateSlots();
  const { slots, isLoading: loadingSlots, error: slotError, fetchSlots } = useNutritionistSlots();
  const { deactivateSlot, isLoading: deactivating } = useDeactivateSlot();

  // Generate form state
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(futureISO(7));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [duration, setDuration] = useState(45);

  // My slots filter
  const [slotFrom, setSlotFrom] = useState(todayISO());
  const [slotTo, setSlotTo] = useState(futureISO(14));

  // Deactivate dialog
  const [deactivateTarget, setDeactivateTarget] = useState<AvailabilitySlotResponse | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(id);
    }
  }, [toast]);

  // Auto-fetch my slots when switching to that tab
  useEffect(() => {
    if (activeTab === "mySlots") {
      handleFetchSlots();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async () => {
    try {
      const data = await generateSlots({ startDate, endDate, startTime, endTime, durationMinutes: duration });
      setToast({ msg: t("availability.generated", { count: data.length }), type: "success" });
    } catch {
      setToast({ msg: genError ?? t("availability.errorGeneric"), type: "error" });
    }
  };

  const handleFetchSlots = () => {
    const from = new Date(slotFrom).toISOString();
    const to = new Date(slotTo + "T23:59:59").toISOString();
    fetchSlots(from, to);
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateSlot(deactivateTarget.id);
      setToast({ msg: t("availability.deactivated"), type: "success" });
      setDeactivateTarget(null);
      handleFetchSlots();
    } catch {
      setToast({ msg: t("availability.errorGeneric"), type: "error" });
    }
  };

  // Group my slots by date
  const slotsByDate = slots.reduce<Record<string, AvailabilitySlotResponse[]>>((acc, s) => {
    const key = new Date(s.startTime).toISOString().slice(0, 10);
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <NutritionistNav />

      <div className="md:pl-56"><SettingsBar /></div>

      {/* Header */}
      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div aria-hidden className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex flex-col">
          <Button variant="ghost" size="sm" onClick={() => navigate("/agenda/nutritionist")} className="w-fit mb-4 text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft size={16} className="mr-1.5" />
            {t("availability.back")}
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("availability.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("availability.subtitle")}</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="md:pl-56 px-4 sm:px-6">
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
          {(["generate", "mySlots"] as Tab[]).map((tab) => (
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
              {tab === "generate" ? t("availability.tabGenerate") : t("availability.tabMySlots")}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pl-56 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

        {/* ══════════ TAB: Generate Slots ══════════ */}
        {activeTab === "generate" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap size={18} className="text-primary" />
                  {t("availability.generateTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground">{t("availability.generateSubtitle")}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="gen-start-date">{t("availability.startDate")}</Label>
                    <Input id="gen-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gen-end-date">{t("availability.endDate")}</Label>
                    <Input id="gen-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="gen-start-time">{t("availability.startTime")}</Label>
                    <Input id="gen-start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gen-end-time">{t("availability.endTime")}</Label>
                    <Input id="gen-end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gen-duration">{t("availability.duration")}</Label>
                  <Input
                    id="gen-duration"
                    type="number"
                    min={15}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                </div>

                <Button id="btn-generate" className="w-full" onClick={handleGenerate} disabled={generating}>
                  {generating
                    ? <><Loader2 size={14} className="animate-spin mr-2" />{t("availability.generating")}</>
                    : <><Zap size={14} className="mr-2" />{t("availability.generateBtn")}</>
                  }
                </Button>

                {genError && (
                  <p className="text-sm text-destructive flex items-center gap-1.5">
                    <AlertCircle size={14} /> {genError}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Generated slots preview */}
            {genSuccess && generatedSlots.length > 0 && (
              <Card className="h-fit">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    {t("availability.generated", { count: generatedSlots.length })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                  <div className="divide-y divide-border/50">
                    {generatedSlots.slice(0, 50).map((s) => (
                      <div key={s.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                        <span className="font-medium">{fmtDate(s.startTime)}</span>
                        <span className="text-muted-foreground">{fmtTime(s.startTime)} – {fmtTime(s.endTime)}</span>
                      </div>
                    ))}
                    {generatedSlots.length > 50 && (
                      <p className="px-4 py-3 text-xs text-muted-foreground text-center">
                        +{generatedSlots.length - 50} more…
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ══════════ TAB: My Slots ══════════ */}
        {activeTab === "mySlots" && (
          <div className="space-y-6">
            {/* Filter bar */}
            <Card>
              <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-1 w-full space-y-2">
                  <Label htmlFor="slot-from">{t("availability.dateFrom")}</Label>
                  <Input id="slot-from" type="date" value={slotFrom} onChange={(e) => setSlotFrom(e.target.value)} />
                </div>
                <div className="flex-1 w-full space-y-2">
                  <Label htmlFor="slot-to">{t("availability.dateTo")}</Label>
                  <Input id="slot-to" type="date" value={slotTo} onChange={(e) => setSlotTo(e.target.value)} />
                </div>
                <Button id="btn-search-slots" onClick={handleFetchSlots} disabled={loadingSlots} className="w-full sm:w-auto">
                  {loadingSlots
                    ? <Loader2 size={14} className="animate-spin" />
                    : <><Search size={14} className="mr-2" />{t("availability.searchSlots")}</>
                  }
                </Button>
              </CardContent>
            </Card>

            {/* Slots list */}
            <Card>
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays size={18} className="text-primary" />
                    {t("availability.mySlotsTitle")}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={handleFetchSlots} disabled={loadingSlots}>
                    <RefreshCw size={16} className={loadingSlots ? "animate-spin" : ""} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingSlots && (
                  <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm">{t("availability.loadingSlots")}</span>
                  </div>
                )}

                {slotError && !loadingSlots && (
                  <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                    <AlertCircle size={28} className="text-destructive/60" />
                    <p className="text-sm">{slotError}</p>
                    <Button size="sm" variant="outline" onClick={handleFetchSlots}>{t("availability.retry")}</Button>
                  </div>
                )}

                {!loadingSlots && !slotError && slots.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                    <Clock size={32} className="opacity-40" />
                    <p className="text-sm">{t("availability.noSlots")}</p>
                  </div>
                )}

                {!loadingSlots && !slotError && Object.keys(slotsByDate).length > 0 && (
                  <div className="divide-y divide-border/50">
                    {Object.entries(slotsByDate)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dateKey, daySlots]) => (
                        <div key={dateKey} className="p-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                            {fmtDate(dateKey + "T00:00:00")}
                          </p>
                          <div className="space-y-2">
                            {daySlots
                              .sort((a, b) => a.startTime.localeCompare(b.startTime))
                              .map((slot) => (
                                <div key={slot.id} className="flex items-center justify-between bg-muted/30 border border-border/50 rounded-lg px-4 py-2.5">
                                  <div className="flex items-center gap-3">
                                    <Clock size={14} className="text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                      {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      {slot.origin}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                    onClick={() => setDeactivateTarget(slot)}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Deactivate dialog */}
      <Dialog open={!!deactivateTarget} onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("availability.deactivateTitle")}</DialogTitle>
            <DialogDescription>{t("availability.deactivateConfirm")}</DialogDescription>
          </DialogHeader>
          {deactivateTarget && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium">{fmtDate(deactivateTarget.startTime)}</p>
              <p className="text-muted-foreground">{fmtTime(deactivateTarget.startTime)} – {fmtTime(deactivateTarget.endTime)}</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>{t("availability.close")}</Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={deactivating}>
              {deactivating
                ? <><Loader2 size={14} className="animate-spin mr-2" />{t("availability.deactivating")}</>
                : t("availability.deactivateBtn")
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
