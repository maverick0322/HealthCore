import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();
const translations: Record<string, string> = {
  'profile.noAllergies': 'Sin alergias registradas',
  'profile.height': 'Estatura',
  'profile.weight': 'Peso actual',
  'profile.bmi': 'IMC',
  'profile.age': 'Edad',
  'profile.years': 'anos',
  'profile.accountSettings': 'Configuracion de Cuenta',
  'profile.name': 'Nombre completo',
  'profile.email': 'Correo electronico',
  'profile.birthDate': 'Fecha de nacimiento',
  'profile.healthData': 'Datos de Salud',
  'profile.gender': 'Genero',
  'profile.activityLevel': 'Nivel de actividad',
  'profile.mainGoal': 'Objetivo principal',
  'profile.preferences': 'Preferencias',
  'profile.dietType': 'Tipo de dieta',
  'profile.allergies': 'Alergias e intolerancias',
  'profile.completeProfile': 'Completa tu perfil',
  'profile.completeProfileDesc': 'Agrega tu informacion de salud para personalizar tu experiencia.',
  'profile.goToOnboarding': 'Completar configuracion',
  'profile.changePassword': 'Cambiar contrasena',
  'profile.changePasswordDesc': 'Actualiza tu contrasena para mantener tu cuenta segura',
  'profile.actionsSection': 'Acciones de cuenta',
  'profile.logout': 'Cerrar sesion',
  'profile.editProfile': 'Editar Perfil',
  'profile.backToDashboard': 'Volver al Dashboard',
  'linking.linkNutritionist': 'Vincular con Nutriologo',
  'linking.linkDesc': 'Escanear QR o ingresar codigo',
  'auth:patient': 'Paciente',
  'auth:footer': 'HealthCore',
  'onboarding:options.gender.FEMALE.label': 'Mujer',
  'onboarding:options.activityLevels.LIGHTLY_ACTIVE.label': 'Ligero',
  'onboarding:options.activityLevels.LIGHTLY_ACTIVE.description': '1-3 dias a la semana',
  'onboarding:options.goals.health.label': 'Mejorar salud',
  'onboarding:options.diets.vegetarian.label': 'Vegetariana',
  'onboarding:options.allergies.lactose.label': 'Lactosa',
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
        email: 'ana@example.com',
        emailVerified: true,
        provider: 'LOCAL',
      },
      logout: mockLogout,
    }),
}));

vi.mock('@/features/clinical/services/clinicalService');
vi.mock('@/features/patient/components/PatientNav', () => ({
  PatientNav: () => <div data-testid="patient-nav" />,
}));
vi.mock('@/shared/components/SettingsBar', () => ({
  SettingsBar: () => <div data-testid="settings-bar" />,
}));
vi.mock('@/shared/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import { PatientProfilePage } from './PatientProfilePage';

describe('PatientProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (clinicalApi.getMyProfile as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue({
      userId: 'patient-1',
      firstName: 'Ana',
      paternalLastName: 'Lopez',
      maternalLastName: 'Ruiz',
      fullName: 'Ana Lopez Ruiz',
      birthDate: '1996-05-13',
      heightCm: 168,
      weightKg: 61.4,
      gender: 'FEMALE',
      activityLevel: 'LIGHTLY_ACTIVE',
      goal: 'health',
      dietType: 'vegetarian',
      allergies: ['lactose'],
      excludedFoods: [],
      nutritionistId: null,
      profileCompleted: true,
    });
  });

  it('removes redundant account items and formats profile values for display', async () => {
    render(<PatientProfilePage />);

    await waitFor(() => {
      expect(screen.getAllByText('Ana Lopez Ruiz').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('13/05/1996')).toBeInTheDocument();
    expect(screen.getByText('Mujer')).toBeInTheDocument();
    expect(screen.getByText('Ligero (1-3 dias a la semana)')).toBeInTheDocument();
    expect(screen.getByText('Mejorar salud')).toBeInTheDocument();
    expect(screen.getByText('Vegetariana')).toBeInTheDocument();
    expect(screen.getByText('Lactosa')).toBeInTheDocument();

    expect(screen.queryByText('Proveedor de autenticacion')).not.toBeInTheDocument();
    expect(screen.queryByText('Editar datos de salud')).not.toBeInTheDocument();
    expect(screen.queryByText('Editar preferencias')).not.toBeInTheDocument();
    expect(screen.queryByText('Desactivar notificaciones')).not.toBeInTheDocument();
  });
});
