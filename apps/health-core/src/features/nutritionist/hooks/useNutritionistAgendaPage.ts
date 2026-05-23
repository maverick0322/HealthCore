import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  addDays,
  formatLocalTime,
  getWeekRange,
  startOfWeek,
  todayDateKey,
} from '@/features/agenda/utils/agendaDateUtils';
import type { WeeklyCalendarItem } from '@/features/agenda/components/WeeklyCalendar';
import { useNutritionistAppointments } from './useNutritionistAppointments';
import { useNutritionistSlots } from './useNutritionistSlots';

export const useNutritionistAgendaPage = () => {
  const { t } = useTranslation('nutritionist');
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

  return {
    weekStart,
    isLoading,
    error,
    calendarItems,
    fetchWeek,
    goToWeek,
    addDays,
    todayDateKey,
    startOfWeek,
  };
};
