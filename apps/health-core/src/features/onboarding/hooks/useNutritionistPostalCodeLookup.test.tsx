import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLookupPostalCode, mockTranslate } = vi.hoisted(() => ({
  mockLookupPostalCode: vi.fn(),
  mockTranslate: (key: string) => key,
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    lookupPostalCode: mockLookupPostalCode,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockTranslate,
  }),
}));

import { useNutritionistPostalCodeLookup } from './useNutritionistPostalCodeLookup';

describe('useNutritionistPostalCodeLookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('autocompletes clinic address data when the postal code exists in the catalog', async () => {
    const setClinicAddress = vi.fn();
    mockLookupPostalCode.mockResolvedValue({
      postalCode: '03100',
      state: 'Ciudad de Mexico',
      city: 'Ciudad de Mexico',
      municipality: 'Benito Juarez',
      colonies: ['Narvarte Oriente', 'Narvarte Poniente'],
    });

    const { result } = renderHook(() =>
      useNutritionistPostalCodeLookup({
        postalCode: '03100',
        getCurrentNeighborhood: () => 'Narvarte Oriente',
        setClinicAddress,
      }),
    );

    await waitFor(
      () => {
        expect(result.current.postalLookupMessage).toBe('nutritionist.contact.lookup.match');
      },
      { timeout: 2000 },
    );

    expect(setClinicAddress).toHaveBeenCalledWith({
      postalCode: '03100',
      state: 'Ciudad de Mexico',
      city: 'Ciudad de Mexico',
      municipality: 'Benito Juarez',
      neighborhood: 'Narvarte Oriente',
    });
  });

  it('switches to manual fallback when the postal code is not found', async () => {
    const setClinicAddress = vi.fn();
    mockLookupPostalCode.mockRejectedValue({
      response: { status: 404 },
    });

    const { result } = renderHook(() =>
      useNutritionistPostalCodeLookup({
        postalCode: '99999',
        getCurrentNeighborhood: () => '',
        setClinicAddress,
      }),
    );

    await waitFor(
      () => {
        expect(result.current.postalLookupMessage).toBe('nutritionist.contact.lookup.manualFallback');
      },
      { timeout: 2000 },
    );
  });
});
