import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();
const translations: Record<string, string> = {
  'profile.title': 'Mi Perfil',
  'profile.subtitle': 'Gestiona tu informacion publica y profesional.',
  'profile.editProfile': 'Editar Perfil',
  'profile.contactInfo': 'Informacion de contacto',
  'profile.credentials': 'Credenciales',
  'profile.license': 'Cedula Profesional',
  'profile.consultationType': 'Tipo de Consulta',
  'profile.bio': 'Biografia Profesional',
  'profile.pendingProfile': 'Perfil profesional pendiente',
  'profile.noPhone': 'Sin teléfono registrado',
  'profile.noAddress': 'Sin dirección registrada',
  'profile.noConsultationTypes': 'Sin tipos de consulta registrados',
  'profile.completeBioPrompt': 'Agrega tu biografia profesional para completar tu perfil.',
  'profile.logout': 'Cerrar sesion',
  'onboarding:options.specializations.FOOD_SAFETY.label': 'Seguridad Alimentaria',
  'onboarding:options.specializations.PERINATAL.label': 'Perinatal',
  'onboarding:options.consultationTypes.ONLINE.label': 'En linea',
  'onboarding:options.consultationTypes.HOME_VISIT.label': 'Visita a domicilio',
};

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('react-i18next', () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => translations[key.includes(':') ? key : namespace ? `${namespace}:${key}` : key] ?? key,
  }),
}));

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: {
        email: 'nutri@example.com',
      },
      logout: mockLogout,
    }),
}));

vi.mock('@/features/clinical/services/clinicalService');
vi.mock('@/features/nutritionist/components/NutritionistNav', () => ({
  NutritionistNav: () => <div data-testid="nutritionist-nav" />,
}));
vi.mock('@/shared/components/SettingsBar', () => ({
  SettingsBar: () => <div data-testid="settings-bar" />,
}));
vi.mock('@/shared/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import { NutritionistProfilePage } from './NutritionistProfilePage';

describe('NutritionistProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (clinicalApi.getMyNutritionistProfile as unknown as {
      mockResolvedValue: (value: unknown) => void;
    }).mockResolvedValue({
      userId: 'nutri-1',
      firstName: 'Laura',
      paternalLastName: 'Sanchez',
      maternalLastName: 'Diaz',
      fullName: 'Laura Sanchez Diaz',
      specializations: ['FOOD_SAFETY', 'PERINATAL'],
      customSpecialization: '',
      professionalLicense: '12345678',
      consultationTypes: ['ONLINE', 'HOME_VISIT'],
      phone: '5512345678',
      clinicAddress: {
        postalCode: '01000',
        state: 'Ciudad de Mexico',
        city: 'Ciudad de Mexico',
        municipality: 'Alvaro Obregon',
        neighborhood: 'Florida',
        street: 'Insurgentes Sur',
        exteriorNumber: '123',
        interiorNumber: '',
      },
      bio: 'Nutriologa clinica con enfoque preventivo.',
      profilePhotoUrl: null,
      profileCompleted: true,
    });
  });

  it('renders translated professional labels instead of raw enum values', async () => {
    render(<NutritionistProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Laura Sanchez Diaz')).toBeInTheDocument();
    });

    expect(screen.getByText('Seguridad Alimentaria')).toBeInTheDocument();
    expect(screen.getByText('Perinatal')).toBeInTheDocument();
    expect(screen.getByText('En linea')).toBeInTheDocument();
    expect(screen.getByText('Visita a domicilio')).toBeInTheDocument();

    expect(screen.queryByText('FOOD_SAFETY')).not.toBeInTheDocument();
    expect(screen.queryByText('ONLINE')).not.toBeInTheDocument();
  });
});
