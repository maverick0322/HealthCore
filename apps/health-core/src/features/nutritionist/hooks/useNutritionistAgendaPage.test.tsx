import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

const {
  mockGetNutritionistPatients,
  mockCreateAppointmentForPatient,
  mockCancelAppointment,
  mockGetAppointmentsHook,
  mockGetSlotsHook,
} = vi.hoisted(() => ({
  mockGetNutritionistPatients: vi.fn(),
  mockCreateAppointmentForPatient: vi.fn(),
  mockCancelAppointment: vi.fn(),
  mockGetAppointmentsHook: vi.fn(),
  mockGetSlotsHook: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getNutritionistPatients: mockGetNutritionistPatients,
  },
}));

vi.mock('../services/nutritionistAgendaService', () => ({
  nutritionistAgendaService: {
    createAppointmentForPatient: mockCreateAppointmentForPatient,
    cancelAppointment: mockCancelAppointment,
  },
}));

vi.mock('./useNutritionistAppointments', () => ({
  useNutritionistAppointments: () => mockGetAppointmentsHook(),
}));

vi.mock('./useNutritionistSlots', () => ({
  useNutritionistSlots: () => mockGetSlotsHook(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { useNutritionistAgendaPage } from './useNutritionistAgendaPage';

describe('useNutritionistAgendaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetNutritionistPatients.mockResolvedValue([
      {
        userId: 'patient-1',
        fullName: 'Ana Lopez',
      },
    ]);

    mockGetAppointmentsHook.mockReturnValue({
      appointments: [
        {
          id: 'app-1',
          slotId: 'slot-2',
          nutritionistId: 'nutri-1',
          patientId: 'patient-1',
          startTime: '2099-06-01T10:00:00Z',
          endTime: '2099-06-01T10:30:00Z',
          status: 'CONFIRMED',
          version: 1,
        },
      ],
      isLoading: false,
      error: null,
      fetchAppointments: vi.fn(),
    });

    mockGetSlotsHook.mockReturnValue({
      slots: [
        {
          id: 'slot-1',
          nutritionistId: 'nutri-1',
          startTime: '2099-06-02T10:00:00Z',
          endTime: '2099-06-02T10:30:00Z',
          origin: 'PREDEFINED',
          version: 1,
          reserved: false,
          active: true,
        },
        {
          id: 'slot-2',
          nutritionistId: 'nutri-1',
          startTime: '2099-06-01T10:00:00Z',
          endTime: '2099-06-01T10:30:00Z',
          origin: 'PREDEFINED',
          version: 2,
          reserved: true,
          active: true,
        },
      ],
      isLoading: false,
      error: null,
      fetchSlots: vi.fn(),
    });
  });

  it('opens the booking dialog when a free slot is clicked', async () => {
    const { result } = renderHook(() => useNutritionistAgendaPage());

    await waitFor(() => {
      expect(result.current.patients).toHaveLength(1);
    });

    act(() => {
      result.current.handleCalendarItemClick({
        id: 'slot-1',
        startTime: '2099-06-02T10:00:00Z',
        endTime: '2099-06-02T10:30:00Z',
        title: 'agenda.freeSlot',
        kind: 'available',
      });
    });

    expect(result.current.bookingTarget?.id).toBe('slot-1');
    expect(result.current.selectedPatientId).toBe('patient-1');
  });

  it('shows the weekly limit error when booking conflicts', async () => {
    mockCreateAppointmentForPatient.mockRejectedValue(
      new axios.AxiosError('Conflict', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config: {} as never,
        data: {},
      }),
    );

    const { result } = renderHook(() => useNutritionistAgendaPage());

    await waitFor(() => {
      expect(result.current.patients).toHaveLength(1);
    });

    act(() => {
      result.current.handleCalendarItemClick({
        id: 'slot-1',
        startTime: '2099-06-02T10:00:00Z',
        endTime: '2099-06-02T10:30:00Z',
        title: 'agenda.freeSlot',
        kind: 'available',
      });
    });

    await act(async () => {
      await result.current.handleBookAppointment();
    });

    await waitFor(() => {
      expect(result.current.toast?.msg).toBe('agenda.errorBookConflictWeekly');
    });
  });

  it('opens the cancel dialog for booked appointments and cancels successfully', async () => {
    mockCancelAppointment.mockResolvedValue(undefined);

    const { result } = renderHook(() => useNutritionistAgendaPage());

    await waitFor(() => {
      expect(result.current.calendarItems.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.handleCalendarItemClick({
        id: 'slot-2',
        startTime: '2099-06-01T10:00:00Z',
        endTime: '2099-06-01T10:30:00Z',
        title: 'agenda.bookedSlot',
        kind: 'appointment',
      });
    });

    expect(result.current.cancelTarget?.id).toBe('app-1');

    await act(async () => {
      await result.current.handleCancelAppointment();
    });

    await waitFor(() => {
      expect(result.current.toast?.msg).toBe('agenda.cancelled');
    });
  });

  it('prefers the active appointment when a slot was cancelled and later rebooked', async () => {
    mockGetAppointmentsHook.mockReturnValue({
      appointments: [
        {
          id: 'app-cancelled',
          slotId: 'slot-2',
          nutritionistId: 'nutri-1',
          patientId: 'patient-old',
          startTime: '2099-06-01T10:00:00Z',
          endTime: '2099-06-01T10:30:00Z',
          status: 'CANCELLED',
          version: 1,
        },
        {
          id: 'app-active',
          slotId: 'slot-2',
          nutritionistId: 'nutri-1',
          patientId: 'patient-1',
          startTime: '2099-06-01T10:00:00Z',
          endTime: '2099-06-01T10:30:00Z',
          status: 'CONFIRMED',
          version: 2,
        },
      ],
      isLoading: false,
      error: null,
      fetchAppointments: vi.fn(),
    });

    const { result } = renderHook(() => useNutritionistAgendaPage());

    await waitFor(() => {
      expect(result.current.patients).toHaveLength(1);
      expect(result.current.calendarItems.length).toBeGreaterThan(0);
    });

    const visibleSlotItem = result.current.calendarItems.find((item) => item.id === 'slot-2');
    expect(visibleSlotItem?.kind).toBe('appointment');

    act(() => {
      result.current.handleCalendarItemClick({
        id: 'slot-2',
        startTime: '2099-06-01T10:00:00Z',
        endTime: '2099-06-01T10:30:00Z',
        title: 'agenda.bookedSlot',
        kind: 'appointment',
      });
    });

    expect(result.current.cancelTarget?.id).toBe('app-active');
  });
});
