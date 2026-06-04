import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  addDays,
  formatLocalTime,
  getWeekRange,
  startOfWeek,
  todayDateKey,
} from '@/features/agenda/utils/agendaDateUtils';
import type { WeeklyCalendarItem } from '@/features/agenda/components/WeeklyCalendar';
import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { NutritionistPatientProfileResponse } from '@/features/clinical/types/clinical.types';
import { nutritionistAgendaService } from '../services/nutritionistAgendaService';
import type { AppointmentResponse, AvailabilitySlotResponse } from '../types/agenda.types';
import { useNutritionistAppointments } from './useNutritionistAppointments';
import { useNutritionistSlots } from './useNutritionistSlots';

export const useNutritionistAgendaPage = () => {
  const { t } = useTranslation('nutritionist');
  const [weekStart, setWeekStart] = useState(startOfWeek(todayDateKey()));
  const [patients, setPatients] = useState<NutritionistPatientProfileResponse[]>([]);
  const [bookingTarget, setBookingTarget] = useState<AvailabilitySlotResponse | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentResponse | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [booking, setBooking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

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

  useEffect(() => {
    let ignore = false;

    const loadPatients = async () => {
      try {
        const linkedPatients = await clinicalApi.getNutritionistPatients();
        if (ignore) return;
        setPatients(linkedPatients);
        setSelectedPatientId((current) => current || linkedPatients[0]?.userId || '');
      } catch {
        if (!ignore) {
          setPatients([]);
        }
      }
    };

    void loadPatients();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

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

  const patientNameById = useMemo(
    () =>
      new Map(
        patients.map((patient) => [patient.userId, patient.fullName?.trim() || patient.userId]),
      ),
    [patients],
  );

  const getAppointmentPriority = (appointment: AppointmentResponse) => {
    switch (appointment.status) {
      case 'PENDING':
        return 4;
      case 'CONFIRMED':
        return 3;
      case 'ATTENDED':
        return 2;
      case 'CANCELLED':
      default:
        return 1;
    }
  };

  const { calendarItems, clickableAppointmentsByItemId } = useMemo(() => {
    const appointmentsBySlot = new Map<string, AppointmentResponse[]>();
    appointments.forEach((appointment) => {
      const current = appointmentsBySlot.get(appointment.slotId) ?? [];
      current.push(appointment);
      appointmentsBySlot.set(appointment.slotId, current);
    });

    const clickableAppointmentMap = new Map<string, AppointmentResponse>();
    const consumedAppointmentIds = new Set<string>();

    const slotItems = slots.map((slot) => {
      const relatedAppointments = appointmentsBySlot.get(slot.id) ?? [];
      relatedAppointments.forEach((appointment) => consumedAppointmentIds.add(appointment.id));

      const sortedRelatedAppointments = [...relatedAppointments].sort((left, right) => {
        const priorityDiff = getAppointmentPriority(right) - getAppointmentPriority(left);
        if (priorityDiff !== 0) return priorityDiff;
        return (right.version ?? 0) - (left.version ?? 0);
      });

      const activeAppointment = sortedRelatedAppointments.find(
        (appointment) => appointment.status === 'PENDING' || appointment.status === 'CONFIRMED',
      );
      const cancelledAppointment = sortedRelatedAppointments.find(
        (appointment) => appointment.status === 'CANCELLED',
      );

      if (activeAppointment) {
        clickableAppointmentMap.set(slot.id, activeAppointment);
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

      if (activeAppointment) {
        return {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          title: t('agenda.bookedSlot'),
          subtitle: `${t('dashboard.patient')}: ${patientNameById.get(activeAppointment.patientId) ?? activeAppointment.patientId}`,
          kind: 'appointment' as const,
        };
      }

      if (cancelledAppointment && !slot.reserved) {
        return {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          title: t('agenda.status.CANCELLED'),
          subtitle: `${t('dashboard.patient')}: ${patientNameById.get(cancelledAppointment.patientId) ?? cancelledAppointment.patientId}`,
          kind: 'cancelled' as const,
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
      .filter((appointment) => !consumedAppointmentIds.has(appointment.id))
      .map((appointment) => {
        if (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') {
          clickableAppointmentMap.set(appointment.id, appointment);
        }
        return {
          id: appointment.id,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          title: appointment.status === 'CANCELLED' ? t('agenda.status.CANCELLED') : t('agenda.bookedSlot'),
          subtitle: `${t('dashboard.patient')}: ${patientNameById.get(appointment.patientId) ?? appointment.patientId}`,
          kind: appointment.status === 'CANCELLED' ? 'cancelled' as const : 'appointment' as const,
        };
      });

    return {
      calendarItems: [...slotItems, ...appointmentItems],
      clickableAppointmentsByItemId: clickableAppointmentMap,
    };
  }, [appointments, patientNameById, slots, t]);

  const handleCalendarItemClick = (item: WeeklyCalendarItem) => {
    if (item.kind === 'available') {
      const slot = slots.find((candidate) => candidate.id === item.id);
      if (slot) {
        setBookingTarget(slot);
        if (!selectedPatientId) {
          setSelectedPatientId(patients[0]?.userId || '');
        }
      }
      return;
    }

    if (item.kind === 'appointment') {
      const appointment = clickableAppointmentsByItemId.get(item.id);
      if (appointment) {
        setCancelTarget(appointment);
      }
    }
  };

  const handleBookAppointment = async () => {
    if (!bookingTarget || !selectedPatientId) return;

    setBooking(true);
    try {
      await nutritionistAgendaService.createAppointmentForPatient({
        slotId: bookingTarget.id,
        slotVersion: bookingTarget.version,
        patientId: selectedPatientId,
        locale: window.navigator.language || 'es-MX',
      });
      setBookingTarget(null);
      setToast({ msg: t('agenda.booked'), type: 'success' });
      fetchWeek();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 409) {
          setToast({ msg: t('agenda.errorBookConflictWeekly'), type: 'error' });
        } else if (status === 403) {
          setToast({ msg: t('agenda.errorBookForbidden'), type: 'error' });
        } else if (status === 404) {
          setToast({ msg: t('agenda.errorBookNotFound'), type: 'error' });
        } else {
          setToast({ msg: t('agenda.errorBookUnexpected'), type: 'error' });
        }
      } else {
        setToast({ msg: t('agenda.errorBookUnexpected'), type: 'error' });
      }
    } finally {
      setBooking(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelTarget) return;

    setCancelling(true);
    try {
      await nutritionistAgendaService.cancelAppointment(cancelTarget.id);
      setCancelTarget(null);
      setToast({ msg: t('agenda.cancelled'), type: 'success' });
      fetchWeek();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 403) {
          setToast({ msg: t('agenda.errorCancelForbidden'), type: 'error' });
        } else if (status === 404) {
          setToast({ msg: t('agenda.errorCancelNotFound'), type: 'error' });
        } else if (status === 409) {
          setToast({ msg: t('agenda.errorCancelInvalid'), type: 'error' });
        } else {
          setToast({ msg: t('agenda.errorCancelUnexpected'), type: 'error' });
        }
      } else {
        setToast({ msg: t('agenda.errorCancelUnexpected'), type: 'error' });
      }
    } finally {
      setCancelling(false);
    }
  };

  return {
    weekStart,
    isLoading,
    error,
    calendarItems,
    patients,
    bookingTarget,
    cancelTarget,
    selectedPatientId,
    booking,
    cancelling,
    toast,
    fetchWeek,
    goToWeek,
    addDays,
    todayDateKey,
    startOfWeek,
    setBookingTarget,
    setCancelTarget,
    setSelectedPatientId,
    handleCalendarItemClick,
    handleBookAppointment,
    handleCancelAppointment,
  };
};
