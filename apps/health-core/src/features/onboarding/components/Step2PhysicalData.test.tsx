import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Step2PhysicalData } from './Step2PhysicalData';
import { usePatientOnboardingStore } from '@/features/onboarding/store/usePatientOnboardingStore';

const translations: Record<string, string> = {
  'onboarding:patient.physical.title': 'Tus datos de salud',
  'onboarding:patient.physical.subtitle': 'Esto nos ayuda a personalizar tu experiencia.',
  'onboarding:patient.physical.birthDateLabel': 'Fecha de nacimiento',
  'onboarding:patient.physical.birthDatePlaceholder': 'dd/mm/aaaa',
  'onboarding:patient.physical.heightLabel': 'Estatura (cm)',
  'onboarding:patient.physical.weightLabel': 'Peso actual (kg)',
  'onboarding:patient.physical.genderLabel': 'Género biológico',
  'onboarding:patient.physical.activityLabel': 'Nivel de actividad física',
  'onboarding:patient.physical.birthDateErrors.required': 'La fecha de nacimiento es obligatoria.',
  'onboarding:patient.physical.birthDateErrors.incomplete': 'Completa la fecha con formato dd/mm/aaaa.',
  'onboarding:patient.physical.birthDateErrors.invalid': 'La fecha de nacimiento es inválida.',
  'onboarding:common.back': 'Regresar',
  'onboarding:common.continue': 'Continuar',
  'onboarding:options.gender.MALE.label': 'Hombre',
  'onboarding:options.gender.FEMALE.label': 'Mujer',
  'onboarding:options.activityLevels.SEDENTARY.label': 'Sedentario',
  'onboarding:options.activityLevels.SEDENTARY.description': 'Poco o nada de ejercicio',
  'onboarding:options.activityLevels.LIGHTLY_ACTIVE.label': 'Ligero',
  'onboarding:options.activityLevels.LIGHTLY_ACTIVE.description': '1-3 días a la semana',
  'onboarding:options.activityLevels.MODERATELY_ACTIVE.label': 'Moderado',
  'onboarding:options.activityLevels.MODERATELY_ACTIVE.description': '3-5 días a la semana',
  'onboarding:options.activityLevels.VERY_ACTIVE.label': 'Intenso',
  'onboarding:options.activityLevels.VERY_ACTIVE.description': '6-7 días a la semana',
  'onboarding:options.activityLevels.EXTRA_ACTIVE.label': 'Atleta',
  'onboarding:options.activityLevels.EXTRA_ACTIVE.description': 'Entrenamientos dobles',
};

vi.mock('react-i18next', () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => translations[key.includes(':') ? key : `${namespace}:${key}`] ?? key,
  }),
}));

describe('Step2PhysicalData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    act(() => {
      usePatientOnboardingStore.setState({
        step: 2,
        identity: {
          firstName: '',
          paternalLastName: '',
          maternalLastName: '',
        },
        physical: {
          birthDate: '1996-05-13',
          heightCm: 175,
          weightKg: 72.5,
          gender: 'MALE',
          activityLevel: 'SEDENTARY',
        },
        goal: 'weight-loss',
        preferences: {
          dietType: 'omnivore',
          allergies: [],
          excludedFoods: [],
        },
        hasExistingProfile: false,
      });
    });
  });

  afterEach(() => {
    act(() => {
      usePatientOnboardingStore.getState().reset();
    });
    vi.useRealTimers();
  });

  it('increments weight continuously while the plus button stays pressed', () => {
    render(<Step2PhysicalData onNext={vi.fn()} onBack={vi.fn()} />);

    const weightIncreaseButton = screen.getByRole('button', { name: 'Peso actual (kg) +' });

    fireEvent.pointerDown(weightIncreaseButton);

    act(() => {
      vi.advanceTimersByTime(351);
      vi.advanceTimersByTime(270);
    });

    fireEvent.pointerUp(weightIncreaseButton);

    expect(usePatientOnboardingStore.getState().physical.weightKg).toBeGreaterThan(72.6);
  });

  it('decrements height continuously while the minus button stays pressed', () => {
    render(<Step2PhysicalData onNext={vi.fn()} onBack={vi.fn()} />);

    const heightDecreaseButton = screen.getByRole('button', { name: 'Estatura (cm) -' });

    fireEvent.pointerDown(heightDecreaseButton);

    act(() => {
      vi.advanceTimersByTime(351);
      vi.advanceTimersByTime(270);
    });

    fireEvent.pointerUp(heightDecreaseButton);

    expect(usePatientOnboardingStore.getState().physical.heightCm).toBeLessThan(174);
  });
});
