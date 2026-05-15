import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PatientAppointmentsPage } from './PatientAppointmentsPage';
import { clinicalApi } from '@/features/clinical/services/clinicalService';

const mockNavigate = vi.fn();
const fetchAppointments = vi.fn();
const fetchAvailability = vi.fn();
const createAppointment = vi.fn();
const cancelAppointment = vi.fn();
const rescheduleAppointment = vi.fn();
const t = (key: string) => key;

vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n: { language: 'en' } }),
}));
vi.mock('@/shared/components/SettingsBar', () => ({ SettingsBar: () => <div /> }));
vi.mock('@/features/patient/components/PatientNav', () => ({ PatientNav: () => <nav /> }));
vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getMyProfile: vi.fn(),
  },
}));
vi.mock('@/features/patient/hooks/usePatientAppointments', () => ({
  usePatientAppointments: () => ({
    appointments: [],
    isLoading: false,
    error: null,
    fetchAppointments,
  }),
}));
vi.mock('@/features/patient/hooks/useAvailability', () => ({
  useAvailability: () => ({
    slots: [
      {
        id: 'slot-1',
        nutritionistId: 'nutri-1',
        startTime: '2026-05-01T15:00:00.000Z',
        endTime: '2026-05-01T15:30:00.000Z',
        origin: 'PREDEFINED',
        version: 3,
      },
    ],
    isLoading: false,
    error: null,
    fetchAvailability,
  }),
}));
vi.mock('@/features/patient/hooks/useCreateAppointment', () => ({
  useCreateAppointment: () => ({
    createAppointment,
    isLoading: false,
    error: null,
    appointment: null,
  }),
}));
vi.mock('@/features/patient/hooks/useCancelAppointment', () => ({
  useCancelAppointment: () => ({ cancelAppointment, isLoading: false, error: null }),
}));
vi.mock('@/features/patient/hooks/useRescheduleAppointment', () => ({
  useRescheduleAppointment: () => ({ rescheduleAppointment, isLoading: false, error: null }),
}));

describe('PatientAppointmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAppointment.mockResolvedValue({ id: 'app-1' });
  });

  it('shows linking state and does not search slots without a clinical link', async () => {
    (clinicalApi.getMyProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'patient-1',
      nutritionistId: null,
    });

    render(<PatientAppointmentsPage />);
    fireEvent.click(screen.getByText('appointments.tabSchedule'));

    expect(await screen.findByText('appointments.noLinkedNutritionist')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /appointments.searchSlots/ }));

    expect(fetchAvailability).not.toHaveBeenCalled();
  });

  it('searches availability with the linked nutritionist id', async () => {
    (clinicalApi.getMyProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'patient-1',
      nutritionistId: 'nutri-1',
    });

    render(<PatientAppointmentsPage />);
    fireEvent.click(screen.getByText('appointments.tabSchedule'));

    expect(await screen.findByText('nutri-1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /appointments.searchSlots/ }));

    expect(fetchAvailability).toHaveBeenCalledWith(
      'nutri-1',
      expect.any(String),
      expect.any(String),
    );
  });

  it('books a selected slot with nutritionist id, slot version, and locale', async () => {
    (clinicalApi.getMyProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'patient-1',
      nutritionistId: 'nutri-1',
    });

    render(<PatientAppointmentsPage />);
    fireEvent.click(screen.getByText('appointments.tabSchedule'));

    await screen.findByText('nutri-1');
    fireEvent.click(screen.getByRole('button', { name: /\d{1,2}:\d{2}/ }));
    fireEvent.click(screen.getByText('appointments.bookSlot'));

    await waitFor(() => {
      expect(createAppointment).toHaveBeenCalledWith({
        slotId: 'slot-1',
        nutritionistId: 'nutri-1',
        slotVersion: 3,
        locale: 'en',
      });
    });
  });
});
