import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  CalendarDays,
  Loader2,
  RefreshCw,
  Settings,
} from 'lucide-react';

import { NutritionistNav } from '@/features/nutritionist/components/NutritionistNav';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { Button } from '@/shared/ui/button';
import { WeeklyCalendar, type WeeklyCalendarItem } from '@/features/agenda/components/WeeklyCalendar';
import {
  addDays,
  formatLocalTime,
  getWeekRange,
  startOfWeek,
  todayDateKey,
} from '@/features/agenda/utils/agendaDateUtils';
import { useNutritionistAppointments } from '@/features/nutritionist/hooks/useNutritionistAppointments';
import { useNutritionistSlots } from '@/features/nutritionist/hooks/useNutritionistSlots';

export const NutritionistAgendaPage = () => {
  const { t } = useTranslation('nutritionist');
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(startOfWeek(todayDateKey()));

  const {
    appointments,
    isLoading: loadingAppointments,
    error: appointmentError,
    fetchAppointments,
  } = useNutritionistAppointments();
  const {
    slots,
    isLoading: loadingSlots,
    error: slotError,
    fetchSlots,
  } = useNutritionistSlots();

  const isLoading = loadingAppointments || loadingSlots;
  const error = appointmentError ?? slotError;

  const fetchWeek = (targetWeek = weekStart) => {
    const range = getWeekRange(targetWeek);
    fetchAppointments(range.from, range.to);
    fetchSlots(range.from, range.to);
  };

  useEffect(() => {
    fetchWeek();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToWeek = (targetWeek: string) => {
    setWeekStart(targetWeek);
    fetchWeek(targetWeek);
  };

  const calendarLabels = {
    previous: t('agenda.calendar.previousWeek'),
    next: t('agenda.calendar.nextWeek'),
    today: t('agenda.calendar.today'),
    empty: t('agenda.noSlotsOrAppointments'),
    loading: t('agenda.loading'),
  };

  const calendarItems = useMemo<WeeklyCalendarItem[]>(() => {
    const appointmentsBySlot = new Map(appointments.map((appointment) => [appointment.slotId, appointment]));
    const usedAppointmentIds = new Set<string>();

    const slotItems = slots.map((slot) => {
      const appointment = appointmentsBySlot.get(slot.id);
      if (appointment) {
        usedAppointmentIds.add(appointment.id);
      }

      if (!slot.active) {
        return {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          title: t('agenda.slotInactive'),
          subtitle: `${formatLocalTime(slot.startTime)} - ${formatLocalTime(slot.endTime)}`,
          kind: 'inactive' as const,
        };
      }

      if (appointment?.status === 'CANCELLED') {
        return {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          title: t('agenda.status.CANCELLED'),
          subtitle: `${t('dashboard.patient')}: ${appointment.patientId}`,
          kind: 'cancelled' as const,
        };
      }

      if (appointment) {
        return {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          title: t('agenda.bookedSlot'),
          subtitle: `${t('dashboard.patient')}: ${appointment.patientId}`,
          kind: 'appointment' as const,
        };
      }

      return {
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        title: slot.reserved ? t('agenda.reservedSlot') : t('agenda.freeSlot'),
        subtitle: `${formatLocalTime(slot.startTime)} - ${formatLocalTime(slot.endTime)}`,
        kind: slot.reserved ? 'reserved' as const : 'available' as const,
      };
    });

    const appointmentItems = appointments
      .filter((appointment) => !usedAppointmentIds.has(appointment.id))
      .map((appointment) => ({
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        title: appointment.status === 'CANCELLED' ? t('agenda.status.CANCELLED') : t('agenda.bookedSlot'),
        subtitle: `${t('dashboard.patient')}: ${appointment.patientId}`,
        kind: appointment.status === 'CANCELLED' ? 'cancelled' as const : 'appointment' as const,
      }));

    return [...slotItems, ...appointmentItems];
  }, [appointments, slots, t]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <NutritionistNav />
      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="border-b border-border bg-primary/10 md:pl-56">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('agenda.title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('agenda.subtitle')}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/agenda/nutritionist/availability')}>
            <Settings size={14} />
            {t('agenda.availability')}
          </Button>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <CalendarDays size={18} className="text-primary" />
              {t('agenda.weeklyCalendar')}
            </h2>
            <p className="text-sm text-muted-foreground">{t('agenda.weeklyCalendarSubtitle')}</p>
          </div>
          <Button variant="outline" onClick={() => fetchWeek()} disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <RefreshCw size={14} className="mr-2" />
                {t('agenda.search')}
              </>
            )}
          </Button>
        </div>

        {error && !isLoading && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <WeeklyCalendar
          title={t('agenda.weeklyCalendar')}
          weekStart={weekStart}
          items={calendarItems}
          labels={calendarLabels}
          isLoading={isLoading}
          onPreviousWeek={() => goToWeek(addDays(weekStart, -7))}
          onNextWeek={() => goToWeek(addDays(weekStart, 7))}
          onToday={() => goToWeek(startOfWeek(todayDateKey()))}
        />
      </main>
    </div>
  );
};
