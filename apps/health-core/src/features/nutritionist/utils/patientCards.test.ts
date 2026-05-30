import { describe, expect, it } from 'vitest';

import { getDisplayIdentity, toPatientCardViewModel } from './patientCards';

describe('patientCards', () => {
  it('falls back to the raw user id when the patient has no full name', () => {
    expect(getDisplayIdentity('patient-1')).toBe('patient-1');
    expect(getDisplayIdentity('   ')).toBe('Paciente');
  });

  it('maps a patient into the expected dashboard card view model', () => {
    const card = toPatientCardViewModel(
      {
        userId: 'patient-1',
        firstName: 'Ana',
        paternalLastName: 'Lopez',
        maternalLastName: '',
        fullName: 'Ana Lopez',
        weightKg: 62,
        heightCm: 165,
        birthDate: '1996-05-10',
        gender: 'FEMALE',
        activityLevel: 'LIGHTLY_ACTIVE',
        goal: 'health',
        dietType: 'omnivore',
        allergies: [],
        excludedFoods: [],
        nutritionistId: 'nutri-1',
        profilePhotoUrl: null,
        profileCompleted: true,
      },
      [
        {
          id: 'appt-1',
          slotId: 'slot-1',
          nutritionistId: 'nutri-1',
          patientId: 'patient-1',
          startTime: '2099-06-01T10:00:00Z',
          endTime: '2099-06-01T10:30:00Z',
          status: 'CONFIRMED',
          version: 1,
        },
      ],
      'Improve health',
      'No visits',
    );

    expect(card).toEqual({
      id: 'patient-1',
      name: 'Ana Lopez',
      profilePhotoUrl: null,
      lastVisit: '2099-06-01T10:00:00Z',
      goal: 'Improve health',
      futureAppointments: 1,
      nextAppointmentAt: '2099-06-01T10:00:00Z',
    });
  });
});
