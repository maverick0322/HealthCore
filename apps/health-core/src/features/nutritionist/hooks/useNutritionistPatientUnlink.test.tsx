import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockUnlinkNutritionist,
  mockGetNutritionistUnlinkErrorMessage,
  mockLogClientError,
} = vi.hoisted(() => ({
  mockUnlinkNutritionist: vi.fn(),
  mockGetNutritionistUnlinkErrorMessage: vi.fn(),
  mockLogClientError: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    unlinkNutritionist: mockUnlinkNutritionist,
  },
}));

vi.mock('@/features/clinical/utils/linkingErrorMessages', () => ({
  getNutritionistUnlinkErrorMessage: mockGetNutritionistUnlinkErrorMessage,
}));

vi.mock('@/core/utils/logger', () => ({
  logClientError: mockLogClientError,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { useNutritionistPatientUnlink } from './useNutritionistPatientUnlink';

describe('useNutritionistPatientUnlink', () => {
  const navigate = vi.fn();
  const setPageFeedback = vi.fn();
  const closeUnlinkModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unlinks the patient and redirects on success', async () => {
    mockUnlinkNutritionist.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useNutritionistPatientUnlink({
        patientId: 'patient-1',
        navigate,
        setPageFeedback,
        closeUnlinkModal,
      })
    );

    await act(async () => {
      await result.current.confirmUnlinkPatient();
    });

    expect(mockUnlinkNutritionist).toHaveBeenCalledWith('patient-1');
    expect(navigate).toHaveBeenCalledWith('/patients/nutritionist');
  });

  it('shows feedback and closes the modal on unlink error', async () => {
    const unlinkError = new Error('unlink failed');
    mockUnlinkNutritionist.mockRejectedValue(unlinkError);
    mockGetNutritionistUnlinkErrorMessage.mockReturnValue('Could not unlink patient');

    const { result } = renderHook(() =>
      useNutritionistPatientUnlink({
        patientId: 'patient-1',
        navigate,
        setPageFeedback,
        closeUnlinkModal,
      })
    );

    await act(async () => {
      await result.current.confirmUnlinkPatient();
    });

    await waitFor(() => {
      expect(setPageFeedback).toHaveBeenCalledWith({
        type: 'error',
        message: 'Could not unlink patient',
      });
    });
    expect(closeUnlinkModal).toHaveBeenCalled();
  });
});
