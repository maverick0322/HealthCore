import { describe, it, expect, beforeEach } from 'vitest';
import { usePatientOnboardingStore } from './usePatientOnboardingStore';

describe('usePatientOnboardingStore', () => {
  beforeEach(() => {
    usePatientOnboardingStore.getState().reset();
  });

  it('should initialize with default values', () => {
    const state = usePatientOnboardingStore.getState();
    
    expect(state.step).toBe(1);
    expect(state.physical.age).toBe(25);
    expect(state.physical.gender).toBe('MALE');
    expect(state.physical.activityLevel).toBe('SEDENTARY');
    expect(state.goal).toBe('weight-loss');
    expect(state.preferences.dietType).toBe('omnivore');
    expect(state.preferences.allergies).toEqual([]);
  });

  it('should strictly navigate between steps within bounds (1 to 4)', () => {
    const store = usePatientOnboardingStore.getState();
    
    store.nextStep();
    expect(usePatientOnboardingStore.getState().step).toBe(2);
    
    store.setStep(4);
    store.nextStep();
    expect(usePatientOnboardingStore.getState().step).toBe(4);

    store.setStep(1);
    store.prevStep();
    expect(usePatientOnboardingStore.getState().step).toBe(1);
  });

  it('should update physical data correctly including gender and activity level', () => {
    const store = usePatientOnboardingStore.getState();
    
    store.setPhysicalData({ 
      weight: 80, 
      gender: 'FEMALE',
      activityLevel: 'VERY_ACTIVE'
    });

    const currentPhysical = usePatientOnboardingStore.getState().physical;
    expect(currentPhysical.weight).toBe(80);
    expect(currentPhysical.gender).toBe('FEMALE');
    expect(currentPhysical.activityLevel).toBe('VERY_ACTIVE');
    expect(currentPhysical.age).toBe(25); 
  });

  it('should toggle allergies correctly', () => {
    const store = usePatientOnboardingStore.getState();
    
    store.toggleAllergy('gluten');
    expect(usePatientOnboardingStore.getState().preferences.allergies).toContain('gluten');
    
    store.toggleAllergy('gluten');
    expect(usePatientOnboardingStore.getState().preferences.allergies).not.toContain('gluten');
  });

  it('should add and remove excluded foods without duplicates', () => {
    const store = usePatientOnboardingStore.getState();
    
    store.addExcludedFood('onion');
    store.addExcludedFood('onion'); 
    store.addExcludedFood('tomato');

    const foods = usePatientOnboardingStore.getState().preferences.excludedFoods;
    expect(foods).toEqual(['onion', 'tomato']); 
    store.removeExcludedFood('onion');
    expect(usePatientOnboardingStore.getState().preferences.excludedFoods).toEqual(['tomato']);
  });
});