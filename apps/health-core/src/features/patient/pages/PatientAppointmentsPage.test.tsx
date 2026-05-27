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
const slotStart = new Date();
slotStart.setHours(15, 0, 0, 0);
const slotEnd = new Date(slotStart);
slotEnd.setMinutes(slotEnd.getMinutes() + 30);

vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n: { language: 'en' } }),
}));
vi.mock('@/shared/components/SettingsBar', () => ({ SettingsBar: () => <div /> }));
vi.mock('@/features/patient/components/PatientNav', () => ({ PatientNav: () => <nav /> }));
vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getMyProfile: vi.fn(),
    getMyLinkedNutritionistProfile: vi.fn(),
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
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        origin: 'PREDEFINED',
        version: 3,
        reserved: false,
        active: true,
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
    (clinicalApi.getMyLinkedNutritionistProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'nutri-1',
      firstName: 'Elena',
      paternalLastName: 'Martinez',
      maternalLastName: '',
      fullName: 'Dra. Elena Martinez',
      specializations: ['CLINICAL'],
      customSpecialization: '',
      professionalLicense: '1234567',
      consultationTypes: ['ONLINE'],
      phone: '',
      clinicAddress: null,
      bio: '',
      profilePhotoUrl: null,
      profileCompleted: true,
    });
  });

  it('shows linking state and does not search slots without a clinical link', async () => {
    (clinicalApi.getMyProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'patient-1',
      nutritionistId: null,
    });

    render(<PatientAppointmentsPage />);
    fireEvent.click(screen.getByText('appointments.tabSchedule'));

    expect(await screen.findByText('appointments.noLinkedNutritionist')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /appointments.searchSlots/ })).not.toBeInTheDocument();

    expect(fetchAvailability).not.toHaveBeenCalled();
  });

  it('searches availability with the linked nutritionist id', async () => {
    (clinicalApi.getMyProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'patient-1',
      nutritionistId: 'nutri-1',
    });

    render(<PatientAppointmentsPage />);
    fireEvent.click(screen.getByText('appointments.tabSchedule'));

    expect(await screen.findByText('Dra. Elena Martinez')).toBeInTheDocument();
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

    await screen.findByText('Dra. Elena Martinez');
    fireEvent.click(screen.getAllByRole('button', { name: /\d{1,2}:\d{2}/ })[0]);
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

  it('shows a friendly agenda unavailable message when booking cannot be verified', async () => {
    (clinicalApi.getMyProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: 'patient-1',
      nutritionistId: 'nutri-1',
    });
    createAppointment.mockRejectedValueOnce({ response: { status: 503 } });

    render(<PatientAppointmentsPage />);
    fireEvent.click(screen.getByText('appointments.tabSchedule'));

    await screen.findByText('Dra. Elena Martinez');
    fireEvent.click(screen.getAllByRole('button', { name: /\d{1,2}:\d{2}/ })[0]);
    fireEvent.click(screen.getByText('appointments.bookSlot'));

    expect(await screen.findByText('appointments.errorServiceUnavailable')).toBeInTheDocument();
  });
});
