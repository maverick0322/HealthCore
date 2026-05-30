import { act, fireEvent, render, screen, waitFor } from '@/test/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useNutritionistOnboardingStore } from '@/features/onboarding/store/useNutritionistOnboardingStore';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getMyNutritionistProfile: vi.fn(),
    lookupPostalCode: vi.fn(),
    createNutritionistProfile: vi.fn(),
    updateMyNutritionistProfile: vi.fn(),
  },
}));

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import { NutritionistOnboardingPage } from './NutritionistOnboardingPage';

describe('NutritionistOnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNutritionistOnboardingStore.getState().reset();
  });

  it('autocompletes state, city and municipality from a known postal code', async () => {
    (clinicalApi.getMyNutritionistProfile as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('not found')
    );
    (clinicalApi.lookupPostalCode as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      postalCode: '03100',
      state: 'Ciudad de Mexico',
      city: 'Ciudad de Mexico',
      municipality: 'Benito Juarez',
      colonies: ['Narvarte Oriente', 'Narvarte Poniente'],
    });

    render(<NutritionistOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText('Complete your identity')).toBeInTheDocument();
    });

    act(() => {
      useNutritionistOnboardingStore.getState().setStep(4);
    });

    const postalCodeInput = await waitFor(() => screen.getByLabelText(/Postal code/i));
    fireEvent.change(postalCodeInput, { target: { value: '03100' } });

    await waitFor(() => {
      expect(screen.getByLabelText('State')).toHaveValue('Ciudad de Mexico');
      expect(screen.getByLabelText('City')).toHaveValue('Ciudad de Mexico');
      expect(screen.getByLabelText('Municipality or borough')).toHaveValue('Benito Juarez');
    }, { timeout: 2000 });

    expect(screen.getByLabelText('State')).toBeDisabled();
    expect(screen.getByText('Postal code found. Select the matching neighborhood.')).toBeInTheDocument();
  });

  it('allows manual address capture when the postal code is not in the local catalog', async () => {
    (clinicalApi.getMyNutritionistProfile as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('not found')
    );
    (clinicalApi.lookupPostalCode as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      response: { status: 404 },
    });

    render(<NutritionistOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText('Complete your identity')).toBeInTheDocument();
    });

    act(() => {
      useNutritionistOnboardingStore.getState().setStep(4);
    });

    fireEvent.change(await waitFor(() => screen.getByLabelText(/Postal code/i)), { target: { value: '99999' } });

    await waitFor(() => {
      expect(
        screen.getByText('We could not find that postal code in the local catalog. You can enter the address manually.')
      ).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(screen.getByLabelText('State')).not.toBeDisabled();
    expect(screen.getByLabelText('Municipality or borough')).not.toBeDisabled();
  });
});
