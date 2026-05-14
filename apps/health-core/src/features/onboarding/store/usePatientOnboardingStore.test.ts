import { beforeEach, describe, expect, it } from 'vitest';

import { usePatientOnboardingStore } from './usePatientOnboardingStore';

describe('usePatientOnboardingStore', () => {
  beforeEach(() => {
    usePatientOnboardingStore.getState().reset();
  });

  it('should initialize with the new draft shape', () => {
    const state = usePatientOnboardingStore.getState();

    expect(state.step).toBe(1);
    expect(state.identity.firstName).toBe('');
    expect(state.physical.birthDate).toBe('');
    expect(state.physical.heightCm).toBe(175);
    expect(state.goal).toBe('weight-loss');
    expect(state.preferences.dietType).toBe('omnivore');
  });

  it('should navigate between five steps within bounds', () => {
    const store = usePatientOnboardingStore.getState();

    store.nextStep();
    expect(usePatientOnboardingStore.getState().step).toBe(2);

    store.setStep(5);
    store.nextStep();
    expect(usePatientOnboardingStore.getState().step).toBe(5);

    store.prevStep();
    expect(usePatientOnboardingStore.getState().step).toBe(4);
  });

  it('should update identity and physical data', () => {
    const store = usePatientOnboardingStore.getState();

    store.setIdentityData({ firstName: 'Carlos', paternalLastName: 'Gomez' });
    store.setPhysicalData({
      birthDate: '1995-01-01',
      weightKg: 80,
      gender: 'FEMALE',
      activityLevel: 'VERY_ACTIVE',
    });

    const currentState = usePatientOnboardingStore.getState();
    expect(currentState.identity.firstName).toBe('Carlos');
    expect(currentState.physical.weightKg).toBe(80);
    expect(currentState.physical.gender).toBe('FEMALE');
    expect(currentState.physical.birthDate).toBe('1995-01-01');
  });

  it('should toggle allergies and excluded foods', () => {
    const store = usePatientOnboardingStore.getState();

    store.toggleAllergy('gluten');
    expect(usePatientOnboardingStore.getState().preferences.allergies).toContain('gluten');

    store.toggleAllergy('gluten');
    expect(usePatientOnboardingStore.getState().preferences.allergies).not.toContain('gluten');

    store.addExcludedFood('onion');
    store.addExcludedFood('onion');
    store.addExcludedFood('tomato');

    expect(usePatientOnboardingStore.getState().preferences.excludedFoods).toEqual([
      'onion',
      'tomato',
    ]);

    store.removeExcludedFood('onion');
    expect(usePatientOnboardingStore.getState().preferences.excludedFoods).toEqual(['tomato']);
  });

  it('should hydrate from an existing profile', () => {
    usePatientOnboardingStore.getState().hydrateFromProfile(
      {
        firstName: 'Carlos',
        paternalLastName: 'Gomez',
        maternalLastName: '',
        weightKg: 70,
        heightCm: 175,
        birthDate: '1990-01-01',
        gender: 'MALE',
        activityLevel: 'MODERATELY_ACTIVE',
        goal: 'health',
        dietType: 'vegan',
        allergies: ['gluten'],
        excludedFoods: ['cebolla'],
      },
      true
    );

    const state = usePatientOnboardingStore.getState();
    expect(state.hasExistingProfile).toBe(true);
    expect(state.identity.firstName).toBe('Carlos');
    expect(state.preferences.dietType).toBe('vegan');
  });
});
