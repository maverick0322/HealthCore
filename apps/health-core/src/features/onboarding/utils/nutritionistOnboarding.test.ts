import { describe, expect, it } from 'vitest';

import {
  buildNutritionistProfilePayload,
  formatManualAddress,
  getNutritionistOnboardingStepErrors,
  hasAnyAddressValue,
} from './nutritionistOnboarding';

const t = (key: string) => key;

describe('nutritionistOnboarding utils', () => {
  it('builds the nutritionist profile payload and sanitizes the address', () => {
    const payload = buildNutritionistProfilePayload({
      identity: {
        firstName: ' Laura ',
        paternalLastName: ' Mendez ',
        maternalLastName: ' Perez ',
      },
      professional: {
        specializations: ['CLINICAL'],
        customSpecialization: '',
        professionalLicense: '1234567',
      },
      consultationTypes: ['ONLINE'],
      contact: {
        phone: '5512345678',
        clinicAddress: {
          postalCode: '03100',
          state: ' ciudad de mexico ',
          city: ' ciudad de mexico ',
          municipality: ' benito juarez ',
          neighborhood: ' narvarte ',
          street: ' eje central ',
          exteriorNumber: ' 12 ',
          interiorNumber: ' 4b ',
        },
      },
      bio: ' Perfil clinico ',
    });

    expect(payload).toEqual({
      firstName: 'Laura',
      paternalLastName: 'Mendez',
      maternalLastName: 'Perez',
      specializations: ['CLINICAL'],
      customSpecialization: '',
      professionalLicense: '1234567',
      consultationTypes: ['ONLINE'],
      phone: '5512345678',
      clinicAddress: {
        postalCode: '03100',
        state: 'ciudad de mexico',
        city: 'ciudad de mexico',
        municipality: 'benito juarez',
        neighborhood: 'narvarte',
        street: 'eje central',
        exteriorNumber: '12',
        interiorNumber: '4b',
      },
      bio: 'Perfil clinico',
    });
  });

  it('formats the manual address and detects address presence', () => {
    const address = {
      postalCode: '03100',
      state: 'CDMX',
      city: 'Ciudad de Mexico',
      municipality: 'Benito Juarez',
      neighborhood: 'Narvarte',
      street: 'Eje Central',
      exteriorNumber: '12',
      interiorNumber: '',
    };

    expect(hasAnyAddressValue(address)).toBe(true);
    expect(formatManualAddress(address)).toContain('Eje Central');
    expect(formatManualAddress(address)).toContain('03100');
  });

  it('returns validation errors for an invalid professional step', () => {
    const errors = getNutritionistOnboardingStepErrors(
      t as never,
      2,
      {
        identity: {
          firstName: '',
          paternalLastName: '',
          maternalLastName: '',
        },
        professional: {
          specializations: [],
          customSpecialization: '',
          professionalLicense: 'abc',
        },
        consultationTypes: [],
        contact: {
          phone: '',
          clinicAddress: {
            postalCode: '',
            state: '',
            city: '',
            municipality: '',
            neighborhood: '',
            street: '',
            exteriorNumber: '',
            interiorNumber: '',
          },
        },
        bio: '',
      },
      null,
    );

    expect(errors.specializations).toBe('nutritionist.validation.specializationsRequired');
    expect(errors.professionalLicense).toBe('nutritionist.validation.professionalLicense');
  });
});
