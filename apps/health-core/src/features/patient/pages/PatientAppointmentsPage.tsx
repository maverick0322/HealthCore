import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { PatientNav } from '@/features/patient/components/PatientNav';
import { WeeklyCalendar, type WeeklyCalendarItem } from '@/features/agenda/components/WeeklyCalendar';
import {
  addDays,
  formatLocalDate,
  formatLocalDateTime,
  formatLocalTime,
  getWeekRange,
  localDateKeyFromIso,
  startOfWeek,
  todayDateKey,
} from '@/features/agenda/utils/agendaDateUtils';

import { useAvailability } from '@/features/patient/hooks/useAvailability';
import { usePatientAppointments } from '@/features/patient/hooks/usePatientAppointments';
import { useCreateAppointment } from '@/features/patient/hooks/useCreateAppointment';
import { useCancelAppointment } from '@/features/patient/hooks/useCancelAppointment';
import { useRescheduleAppointment } from '@/features/patient/hooks/useRescheduleAppointment';
import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { NutritionistProfileResponse } from '@/features/clinical/types/clinical.types';
import { formatNutritionistSpecializationLabel } from '@/features/onboarding/utils/profilePresentation';
import type { AppointmentResponse, AvailabilitySlotResponse } from '@/features/patient/types/agenda.types';

type Tab = 'appointments' | 'schedule';

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'CONFIRMED':
    case 'ATTENDED':
      return <CheckCircle2 size={14} className="text-emerald-500" />;
    case 'CANCELLED':
      return <XCircle size={14} className="text-destructive" />;
    default:
      return <Clock size={14} className="text-amber-500" />;
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
    case 'ATTENDED':
      return 'text-emerald-500';
    case 'CANCELLED':
      return 'text-destructive';
    default:
      return 'text-amber-500';
  }
};

export const PatientAppointmentsPage = () => {
  const { t, i18n } = useTranslation('patient');
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('appointments');
  const [selectedDate, setSelectedDate] = useState(todayDateKey());
  const [weekStart, setWeekStart] = useState(startOfWeek(todayDateKey()));
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlotResponse | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentResponse | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentResponse | null>(null);
  const [rescheduleSlot, setRescheduleSlot] = useState<AvailabilitySlotResponse | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [linkedNutritionistId, setLinkedNutritionistId] = useState<string | null>(null);
  const [nutritionistProfile, setNutritionistProfile] = useState<NutritionistProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const { appointments, isLoading: loadingAppts, error: apptError, fetchAppointments } = usePatientAppointments();
  const { slots, isLoading: loadingSlots, error: slotError, fetchAvailability } = useAvailability();
  const { createAppointment, isLoading: booking } = useCreateAppointment();
  const { cancelAppointment, isLoading: cancelling } = useCancelAppointment();
  const { rescheduleAppointment, isLoading: rescheduling } = useRescheduleAppointment();

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    let ignore = false;

    const fetchProfile = async () => {
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const profile = await clinicalApi.getMyProfile();
        if (!ignore) {
          const nutritionistId = profile.nutritionistId?.trim() || null;
          setLinkedNutritionistId(nutritionistId);
          if (nutritionistId) {
            try {
              const linkedProfile = await clinicalApi.getMyLinkedNutritionistProfile();
              if (!ignore) {
                setNutritionistProfile(linkedProfile);
              }
            } catch {
              if (!ignore) {
                setNutritionistProfile(null);
              }
            }
          } else {
            setNutritionistProfile(null);
          }
        }
      } catch {
        if (!ignore) {
          setProfileError(t('appointments.profileLoadError'));
          setLinkedNutritionistId(null);
          setNutritionistProfile(null);
        }
      } finally {
        if (!ignore) {
          setLoadingProfile(false);
        }
      }
    };

    fetchProfile();
    return () => {
      ignore = true;
    };
  }, [t]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const calendarLabels = {
    previous: t('appointments.calendar.previousWeek'),
    next: t('appointments.calendar.nextWeek'),
    today: t('appointments.calendar.today'),
    empty: t('appointments.noAvailableTimes'),
    loading: t('appointments.loadingSlots'),
  };

  const fetchSlotsForDate = async (
    nutritionistId: string | null = linkedNutritionistId,
    targetDate = selectedDate,
  ) => {
    if (!nutritionistId) return;
    const targetWeekStart = startOfWeek(targetDate);
    const range = getWeekRange(targetWeekStart);
    setWeekStart(targetWeekStart);
    setSelectedSlot(null);
    setRescheduleSlot(null);
    await fetchAvailability(nutritionistId, range.from, range.to);
  };

  const goToWeek = (targetWeek: string) => {
    setWeekStart(targetWeek);
    setSelectedDate(targetWeek);
    if (linkedNutritionistId) {
      void fetchSlotsForDate(linkedNutritionistId, targetWeek);
    }
  };

  const availabilityItems = useMemo<WeeklyCalendarItem[]>(
    () =>
      slots.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        title: formatLocalTime(slot.startTime),
        subtitle: t('appointments.availableSlot'),
        kind: selectedSlot?.id === slot.id || rescheduleSlot?.id === slot.id ? 'selected' : 'available',
      })),
    [rescheduleSlot?.id, selectedSlot?.id, slots, t],
  );

  const handleSearchSlots = () => {
    void fetchSlotsForDate();
  };

  useEffect(() => {
    if (activeTab === 'schedule' && linkedNutritionistId) {
      void fetchSlotsForDate(linkedNutritionistId, selectedDate);
    }
  }, [activeTab, linkedNutritionistId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBook = async () => {
    if (!selectedSlot) return;
    try {
      await createAppointment({
        slotId: selectedSlot.id,
        nutritionistId: selectedSlot.nutritionistId,
        slotVersion: selectedSlot.version,
        locale: i18n.language,
      });
      setToast({ msg: t('appointments.appointmentConfirmed'), type: 'success' });
      setSelectedSlot(null);
      fetchAppointments();
      void fetchSlotsForDate();
    } catch {
      setToast({ msg: t('appointments.errorGeneric'), type: 'error' });
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelAppointment(cancelTarget.id);
      setToast({ msg: t('appointments.appointmentCancelled'), type: 'success' });
      setCancelTarget(null);
      fetchAppointments();
    } catch {
      setToast({ msg: t('appointments.errorGeneric'), type: 'error' });
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleTarget || !rescheduleSlot) return;
    try {
      await rescheduleAppointment(rescheduleTarget.id, {
        newSlotId: rescheduleSlot.id,
        newSlotVersion: rescheduleSlot.version,
        locale: i18n.language,
      });
      setToast({ msg: t('appointments.appointmentRescheduled'), type: 'success' });
      setRescheduleTarget(null);
      setRescheduleSlot(null);
      fetchAppointments();
      void fetchSlotsForDate();
    } catch {
      setToast({ msg: t('appointments.errorGeneric'), type: 'error' });
    }
  };

  const selectCalendarItem = (item: WeeklyCalendarItem, mode: 'book' | 'reschedule') => {
    const slot = slots.find((candidate) => candidate.id === item.id);
    if (!slot) return;
    if (mode === 'book') {
      setSelectedSlot(selectedSlot?.id === slot.id ? null : slot);
    } else {
      setRescheduleSlot(rescheduleSlot?.id === slot.id ? null : slot);
    }
  };

  const nutritionistName = nutritionistProfile?.fullName?.trim() || t('appointments.assignedNutritionist');
  const nutritionistSpecializations = nutritionistProfile
    ? nutritionistProfile.specializations
        .slice(0, 3)
        .map((specialization) => specialization === 'OTHER' && nutritionistProfile.customSpecialization
          ? nutritionistProfile.customSpecialization
          : formatNutritionistSpecializationLabel(t, specialization))
    : [];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <PatientNav />
      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="border-b border-border bg-primary/10 md:pl-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('appointments.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('appointments.subtitle')}</p>
        </div>
      </div>

      {toast && (
        <div className="md:pl-56 px-4 sm:px-6">
          <div className={`max-w-7xl mx-auto mt-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
              : 'bg-destructive/10 text-destructive border border-destructive/25'
          }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        </div>
      )}

      <div className="md:pl-56 px-4 sm:px-6 pt-4">
        <div className="max-w-7xl mx-auto flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
          {(['appointments', 'schedule'] as Tab[]).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'appointments' ? t('appointments.tabMyAppointments') : t('appointments.tabSchedule')}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-8 md:pl-56">
        {activeTab === 'appointments' && (
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarCheck size={18} className="text-primary" />
                  {t('appointments.tabMyAppointments')}
                </CardTitle>
                <Button id="btn-refresh-appts" variant="ghost" size="icon" onClick={fetchAppointments} disabled={loadingAppts}>
                  <RefreshCw size={16} className={loadingAppts ? 'animate-spin' : ''} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAppts && (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">{t('appointments.loadingAppointments')}</span>
                </div>
              )}

              {apptError && !loadingAppts && (
                <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                  <AlertCircle size={28} className="text-destructive/60" />
                  <p className="text-sm">{apptError}</p>
                  <Button size="sm" variant="outline" onClick={fetchAppointments}>{t('appointments.retry')}</Button>
                </div>
              )}

              {!loadingAppts && !apptError && appointments.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Calendar size={32} className="opacity-40" />
                  <p className="text-sm">{t('appointments.noAppointments')}</p>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('schedule')}>
                    {t('appointments.scheduleNew')}
                  </Button>
                </div>
              )}

              {!loadingAppts && !apptError && appointments.length > 0 && (
                <div className="divide-y divide-border/50">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{formatLocalDateTime(appt.startTime)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatLocalTime(appt.startTime)} - {formatLocalTime(appt.endTime)}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1.5 bg-background border px-2 py-1 rounded-md text-xs font-medium ${statusColor(appt.status)}`}>
                          <StatusIcon status={appt.status} />
                          {t(`appointments.status.${appt.status}`)}
                        </div>
                      </div>

                      {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            id={`btn-cancel-${appt.id}`}
                            size="sm"
                            variant="destructive"
                            className="text-xs h-7"
                            onClick={() => setCancelTarget(appt)}
                          >
                            <XCircle size={13} className="mr-1" />
                            {t('appointments.cancelBtn')}
                          </Button>
                          <Button
                            id={`btn-reschedule-${appt.id}`}
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => {
                              setRescheduleTarget(appt);
                              setRescheduleSlot(null);
                              const appointmentDate = appt.startTime ? localDateKeyFromIso(appt.startTime) : selectedDate;
                              setSelectedDate(appointmentDate);
                              void fetchSlotsForDate(appt.nutritionistId, appointmentDate);
                            }}
                          >
                            <RefreshCw size={13} className="mr-1" />
                            {t('appointments.rescheduleBtn')}
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

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-4">
                {loadingProfile && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    {t('appointments.loadingProfile')}
                  </div>
                )}

                {profileError && !loadingProfile && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                {!loadingProfile && !profileError && linkedNutritionistId && (
                  <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 px-3 py-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase text-muted-foreground">{t('appointments.assignedNutritionist')}</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{nutritionistName}</p>
                      {nutritionistSpecializations.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {nutritionistSpecializations.map((specialization) => (
                            <span
                              key={specialization}
                              className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                            >
                              {specialization}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 lg:w-56">
                      <Label htmlFor="appointment-date">{t('appointments.date')}</Label>
                      <Input
                        id="appointment-date"
                        type="date"
                        min={todayDateKey()}
                        value={selectedDate}
                        onChange={(event) => setSelectedDate(event.target.value)}
                      />
                    </div>
                    <Button id="btn-search-slots" onClick={handleSearchSlots} disabled={loadingSlots}>
                      {loadingSlots ? (
                        <>
                          <Loader2 size={14} className="animate-spin mr-2" />
                          {t('appointments.loadingSlots')}
                        </>
                      ) : (
                        <>
                          <Search size={14} className="mr-2" />
                          {t('appointments.searchSlots')}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {!loadingProfile && !profileError && !linkedNutritionistId && (
                  <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-3">
                    <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{t('appointments.noLinkedNutritionist')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t('appointments.noLinkedNutritionistDesc')}</p>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => navigate('/scanning/patient')}>
                      {t('appointments.linkNutritionistAction')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {slotError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle size={16} />
                {slotError}
              </div>
            )}

            <WeeklyCalendar
              title={t('appointments.selectTime')}
              weekStart={weekStart}
              items={availabilityItems}
              labels={calendarLabels}
              isLoading={loadingSlots}
              onPreviousWeek={() => goToWeek(addDays(weekStart, -7))}
              onNextWeek={() => goToWeek(addDays(weekStart, 7))}
              onToday={() => goToWeek(startOfWeek(todayDateKey()))}
              onItemClick={(item) => selectCalendarItem(item, 'book')}
            />

            {selectedSlot && (
              <Card>
                <CardContent className="pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{formatLocalDate(selectedSlot.startTime)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatLocalTime(selectedSlot.startTime)} - {formatLocalTime(selectedSlot.endTime)}
                    </p>
                  </div>
                  <Button id="btn-book-slot" onClick={handleBook} disabled={booking}>
                    {booking ? (
                      <>
                        <Loader2 size={14} className="animate-spin mr-2" />
                        {t('appointments.booking')}
                      </>
                    ) : (
                      t('appointments.bookSlot')
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('appointments.cancelTitle')}</DialogTitle>
            <DialogDescription>{t('appointments.cancelConfirm')}</DialogDescription>
          </DialogHeader>
          {cancelTarget && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium">{formatLocalDateTime(cancelTarget.startTime)}</p>
              <p className="text-muted-foreground">
                {formatLocalTime(cancelTarget.startTime)} - {formatLocalTime(cancelTarget.endTime)}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelTarget(null)}>{t('appointments.close')}</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  {t('appointments.cancelling')}
                </>
              ) : (
                t('appointments.cancelBtn')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rescheduleTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRescheduleTarget(null);
            setRescheduleSlot(null);
          }
        }}
      >
        <DialogContent className="max-h-[92dvh] max-w-[min(95vw,900px)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('appointments.rescheduleTitle')}</DialogTitle>
            <DialogDescription>{t('appointments.rescheduleSelectSlot')}</DialogDescription>
          </DialogHeader>
          <WeeklyCalendar
            title={t('appointments.selectTime')}
            weekStart={weekStart}
            items={availabilityItems}
            labels={calendarLabels}
            isLoading={loadingSlots}
            onPreviousWeek={() => goToWeek(addDays(weekStart, -7))}
            onNextWeek={() => goToWeek(addDays(weekStart, 7))}
            onToday={() => goToWeek(startOfWeek(todayDateKey()))}
            onItemClick={(item) => selectCalendarItem(item, 'reschedule')}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRescheduleTarget(null); setRescheduleSlot(null); }}>
              {t('appointments.close')}
            </Button>
            <Button onClick={handleReschedule} disabled={!rescheduleSlot || rescheduling}>
              {rescheduling ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  {t('appointments.rescheduling')}
                </>
              ) : (
                t('appointments.rescheduleBtn')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
