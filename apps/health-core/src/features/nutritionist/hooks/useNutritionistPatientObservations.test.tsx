import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCreateObservation,
  mockUpdateObservation,
  mockDeleteObservation,
  mockLogClientError,
} = vi.hoisted(() => ({
  mockCreateObservation: vi.fn(),
  mockUpdateObservation: vi.fn(),
  mockDeleteObservation: vi.fn(),
  mockLogClientError: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  createObservation: mockCreateObservation,
  updateObservation: mockUpdateObservation,
  deleteObservation: mockDeleteObservation,
}));

vi.mock('@/core/utils/logger', () => ({
  logClientError: mockLogClientError,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { useNutritionistPatientObservations } from './useNutritionistPatientObservations';

describe('useNutritionistPatientObservations', () => {
  const loadObservations = vi.fn();
  const setPageFeedback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    loadObservations.mockResolvedValue([]);
  });

  it('creates a new observation and refreshes the list', async () => {
    const { result } = renderHook(() =>
      useNutritionistPatientObservations({
        patientId: 'patient-1',
        loadObservations,
        setPageFeedback,
      })
    );

    act(() => {
      result.current.setNewNote(' Increase hydration ');
    });

    await act(async () => {
      await result.current.handleSaveObservation();
    });

    expect(mockCreateObservation).toHaveBeenCalledWith({
      patientId: 'patient-1',
      note: 'Increase hydration',
    });
    expect(loadObservations).toHaveBeenCalledTimes(1);
    expect(result.current.newNote).toBe('');
  });

  it('updates and clears the editing observation on success', async () => {
    const observation = {
      id: 'obs-1',
      patientId: 'patient-1',
      nutritionistId: 'nutri-1',
      note: 'Initial note',
      createdAt: '2026-05-30T10:00:00Z',
    };

    const { result } = renderHook(() =>
      useNutritionistPatientObservations({
        patientId: 'patient-1',
        loadObservations,
        setPageFeedback,
      })
    );

    act(() => {
      result.current.handleStartEditObservation(observation);
      result.current.setEditingObservationNote('Updated note');
    });

    await act(async () => {
      await result.current.handleUpdateObservation();
    });

    expect(mockUpdateObservation).toHaveBeenCalledWith('obs-1', { note: 'Updated note' });
    expect(result.current.editingObservation).toBeNull();
    expect(result.current.editingObservationNote).toBe('');
  });

  it('shows feedback when deleting an observation fails', async () => {
    mockDeleteObservation.mockRejectedValueOnce(new Error('delete failed'));

    const observation = {
      id: 'obs-1',
      patientId: 'patient-1',
      nutritionistId: 'nutri-1',
      note: 'Initial note',
      createdAt: '2026-05-30T10:00:00Z',
    };

    const { result } = renderHook(() =>
      useNutritionistPatientObservations({
        patientId: 'patient-1',
        loadObservations,
        setPageFeedback,
      })
    );

    act(() => {
      result.current.setObservationToDelete(observation);
    });

    await act(async () => {
      await result.current.handleDeleteObservation();
    });

    await waitFor(() => {
      expect(setPageFeedback).toHaveBeenCalledWith({
        type: 'error',
        message: 'patients.file.observationDeleteError',
      });
    });
  });
});
