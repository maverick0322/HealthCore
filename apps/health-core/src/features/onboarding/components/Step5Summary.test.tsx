import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Step5Summary } from './Step5Summary';
import { usePatientOnboardingStore } from '@/features/onboarding/store/usePatientOnboardingStore';

const translations: Record<string, string> = {
  'onboarding:patient.summary.title': 'Revisa tu perfil',
  'onboarding:patient.summary.subtitle': 'Confirma que toda la informacion esta correcta antes de continuar.',
  'onboarding:patient.summary.sections.identity': 'Identidad',
  'onboarding:patient.summary.sections.physical': 'Datos fisicos',
  'onboarding:patient.summary.sections.goal': 'Meta principal',
  'onboarding:patient.summary.sections.preferences': 'Preferencias',
  'onboarding:patient.summary.noAllergies': 'Sin alergias registradas',
  'onboarding:patient.summary.editButton': 'Editar mis datos',
  'onboarding:common.saveChanges': 'Guardar cambios',
  'onboarding:common.finishAndContinue': 'Finalizar y continuar',
  'onboarding:common.creating': 'Creando perfil...',
  'onboarding:common.saving': 'Guardando cambios...',
  'onboarding:options.gender.FEMALE.label': 'Mujer',
  'onboarding:options.activityLevels.LIGHTLY_ACTIVE.label': 'Ligero',
  'onboarding:options.activityLevels.LIGHTLY_ACTIVE.description': '1-3 dias a la semana',
  'onboarding:options.goals.health.label': 'Mejorar salud',
  'onboarding:options.diets.vegetarian.label': 'Vegetariana',
  'onboarding:options.allergies.lactose.label': 'Lactosa',
};

vi.mock('react-i18next', () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string, options?: Record<string, string | number>) => {
      const resolvedKey = key.includes(':') ? key : namespace ? `${namespace}:${key}` : key;
      if (resolvedKey === 'onboarding:patient.summary.physicalValue') {
        return `${options?.age} años, ${options?.height} cm, ${options?.weight} kg`;
      }
      if (resolvedKey === 'onboarding:patient.summary.physicalDescription') {
        return `${options?.birthDate}, ${options?.gender}, ${options?.activity}`;
      }
      if (resolvedKey === 'onboarding:patient.summary.allergiesDescription') {
        return `Alergias: ${options?.allergies}`;
      }
      return translations[resolvedKey] ?? key;
    },
  }),
}));

describe('Step5Summary', () => {
  beforeEach(() => {
    act(() => {
      usePatientOnboardingStore.setState({
        step: 5,
        identity: {
          firstName: 'Ana',
          paternalLastName: 'Lopez',
          maternalLastName: 'Ruiz',
        },
        physical: {
          birthDate: '1996-05-13',
          heightCm: 168,
          weightKg: 61.4,
          gender: 'FEMALE',
          activityLevel: 'LIGHTLY_ACTIVE',
        },
        goal: 'health',
        preferences: {
          dietType: 'vegetarian',
          allergies: ['lactose'],
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
  });

  it('shows formatted labels and goes back one step when editing data', () => {
    const onBack = vi.fn();

    render(
      <Step5Summary
        mode="edit"
        isSubmitting={false}
        submitError={null}
        onBack={onBack}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('13/05/1996, Mujer, Ligero (1-3 dias a la semana)')).toBeInTheDocument();
    expect(screen.getByText('Mejorar salud')).toBeInTheDocument();
    expect(screen.getByText('Vegetariana')).toBeInTheDocument();
    expect(screen.getByText('Alergias: Lactosa')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Editar mis datos' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
