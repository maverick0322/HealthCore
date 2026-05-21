import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { NutritionistProfileResponse } from '@/features/clinical/types/clinical.types';
import { formatNutritionistSpecializationLabel } from '@/features/onboarding/utils/profilePresentation';
import type { WeeklyCalendarItem } from '@/features/agenda/components/WeeklyCalendar';
import {
  formatLocalTime,
  getWeekRange,
  localDateKeyFromIso,
  startOfWeek,
  todayDateKey,
  addDays,
} from '@/features/agenda/utils/agendaDateUtils';

import { usePatientAppointments } from './usePatientAppointments';
import { useAvailability } from './useAvailability';
import { useCreateAppointment } from './useCreateAppointment';
import { useCancelAppointment } from './useCancelAppointment';
import { useRescheduleAppointment } from './useRescheduleAppointment';
import type { AppointmentResponse, AvailabilitySlotResponse } from '../types/agenda.types';

type Tab = 'appointments' | 'schedule';

interface Toast {
  msg: string;
  type: 'success' | 'error';
}

/**
 * Master hook that composes all patient appointment sub-hooks.
 * The page component calls this hook and renders what it returns — no async
 * logic should live in the page.
 */
export const usePatientAppointmentsPage = () => {
  const { t, i18n } = useTranslation('patient');
  const navigate = useNavigate();

  // ── Tab & navigation state ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('appointments');
  const [selectedDate, setSelectedDate] = useState(todayDateKey());
  const [weekStart, setWeekStart] = useState(startOfWeek(todayDateKey()));

  // ── Dialog / selection state ──────────────────────────────────────────────
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlotResponse | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentResponse | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentResponse | null>(null);
  const [rescheduleSlot, setRescheduleSlot] = useState<AvailabilitySlotResponse | null>(null);

  // ── Toast state ───────────────────────────────────────────────────────────
  const [toast, setToast] = useState<Toast | null>(null);

  // ── Nutritionist profile ──────────────────────────────────────────────────
  const [linkedNutritionistId, setLinkedNutritionistId] = useState<string | null>(null);
  const [nutritionistProfile, setNutritionistProfile] = useState<NutritionistProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // ── Sub-hooks ─────────────────────────────────────────────────────────────
  const { appointments, isLoading: loadingAppts, error: apptError, fetchAppointments } = usePatientAppointments();
  const { slots, isLoading: loadingSlots, error: slotError, fetchAvailability } = useAvailability();
  const { createAppointment, isLoading: booking } = useCreateAppointment();
  const { cancelAppointment, isLoading: cancelling } = useCancelAppointment();
  const { rescheduleAppointment, isLoading: rescheduling } = useRescheduleAppointment();

  // ── Toast auto-dismiss ────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  // ── Fetch appointments on mount ───────────────────────────────────────────
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ── Load linked nutritionist profile ─────────────────────────────────────
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
              if (!ignore) setNutritionistProfile(linkedProfile);
            } catch {
              if (!ignore) setNutritionistProfile(null);
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
        if (!ignore) setLoadingProfile(false);
      }
    };
    void fetchProfile();
    return () => { ignore = true; };
  }, [t]);

  // ── Fetch slots when switching to Schedule tab ────────────────────────────
  useEffect(() => {
    if (activeTab === 'schedule' && linkedNutritionistId) {
      void fetchSlotsForDate(linkedNutritionistId, selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, linkedNutritionistId]);

  // ── Slot fetching ─────────────────────────────────────────────────────────
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

  const goToPreviousWeek = () => goToWeek(addDays(weekStart, -7));
  const goToNextWeek = () => goToWeek(addDays(weekStart, 7));
  const goToToday = () => goToWeek(startOfWeek(todayDateKey()));

  // ── Booking ───────────────────────────────────────────────────────────────
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

  // ── Cancel ────────────────────────────────────────────────────────────────
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

  // ── Reschedule ────────────────────────────────────────────────────────────
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

  const openRescheduleFor = (appt: AppointmentResponse) => {
    setRescheduleTarget(appt);
    setRescheduleSlot(null);
    const appointmentDate = appt.startTime ? localDateKeyFromIso(appt.startTime) : selectedDate;
    setSelectedDate(appointmentDate);
    void fetchSlotsForDate(appt.nutritionistId, appointmentDate);
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

  const handleSearchSlots = () => { void fetchSlotsForDate(); };

  const navigateToScan = () => navigate('/scanning/patient');

  // ── Calendar items ────────────────────────────────────────────────────────
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

  // ── Nutritionist display ──────────────────────────────────────────────────
  const nutritionistName = nutritionistProfile?.fullName?.trim() || t('appointments.assignedNutritionist');
  const nutritionistSpecializations = nutritionistProfile
    ? nutritionistProfile.specializations
      .slice(0, 3)
      .map((s) =>
        s === 'OTHER' && nutritionistProfile.customSpecialization
          ? nutritionistProfile.customSpecialization
          : formatNutritionistSpecializationLabel(t, s),
      )
    : [];

  return {
    // Tab
    activeTab,
    setActiveTab,
    // Calendar navigation
    weekStart,
    selectedDate,
    setSelectedDate,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    // Data
    appointments,
    availabilityItems,
    slots,
    // Loading / error
    loadingAppts,
    apptError,
    loadingSlots,
    slotError,
    loadingProfile,
    profileError,
    // Nutritionist
    linkedNutritionistId,
    nutritionistName,
    nutritionistSpecializations,
    // Dialog state
    selectedSlot,
    cancelTarget,
    setCancelTarget,
    rescheduleTarget,
    setRescheduleTarget,
    rescheduleSlot,
    toast,
    // Actions
    fetchAppointments,
    handleBook,
    handleCancel,
    handleReschedule,
    handleSearchSlots,
    openRescheduleFor,
    selectCalendarItem,
    navigateToScan,
    // Loading flags for actions
    booking,
    cancelling,
    rescheduling,
  };
};
