import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  createObservation,
  deleteObservation,
  updateObservation,
} from '@/features/clinical/services/clinicalService';
import type { ObservationResponse } from '@/features/clinical/types/clinical.types';
import { logClientError } from '@/core/utils/logger';

interface PatientFileFeedback {
  type: 'success' | 'error';
  message: string;
}

interface UseNutritionistPatientObservationsOptions {
  patientId: string;
  loadObservations: () => Promise<ObservationResponse[]>;
  setPageFeedback: React.Dispatch<React.SetStateAction<PatientFileFeedback | null>>;
}

export const useNutritionistPatientObservations = ({
  patientId,
  loadObservations,
  setPageFeedback,
}: UseNutritionistPatientObservationsOptions) => {
  const { t } = useTranslation('nutritionist');
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [editingObservation, setEditingObservation] = useState<ObservationResponse | null>(null);
  const [editingObservationNote, setEditingObservationNote] = useState('');
  const [isUpdatingObservation, setIsUpdatingObservation] = useState(false);
  const [observationToDelete, setObservationToDelete] = useState<ObservationResponse | null>(null);
  const [isDeletingObservation, setIsDeletingObservation] = useState(false);

  const handleSaveObservation = async () => {
    if (!newNote.trim() || !patientId) {
      return;
    }

    setIsSavingNote(true);
    try {
      await createObservation({ patientId, note: newNote.trim() });
      setNewNote('');
      await loadObservations();
    } catch (error) {
      logClientError('NutritionistPatientFilePage.observation.save.error', error, { patientId });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleStartEditObservation = (observation: ObservationResponse) => {
    setEditingObservation(observation);
    setEditingObservationNote(observation.note);
  };

  const resetEditingObservation = () => {
    setEditingObservation(null);
    setEditingObservationNote('');
  };

  const handleUpdateObservation = async () => {
    if (!editingObservation || !editingObservationNote.trim()) {
      return;
    }

    setIsUpdatingObservation(true);
    try {
      await updateObservation(editingObservation.id, { note: editingObservationNote.trim() });
      resetEditingObservation();
      await loadObservations();
    } catch (error) {
      logClientError('NutritionistPatientFilePage.observation.update.error', error, {
        patientId,
        observationId: editingObservation.id,
      });
      setPageFeedback({
        type: 'error',
        message: t('patients.file.observationUpdateError'),
      });
    } finally {
      setIsUpdatingObservation(false);
    }
  };

  const handleDeleteObservation = async () => {
    if (!observationToDelete) {
      return;
    }

    setIsDeletingObservation(true);
    try {
      await deleteObservation(observationToDelete.id);
      setObservationToDelete(null);
      await loadObservations();
    } catch (error) {
      logClientError('NutritionistPatientFilePage.observation.delete.error', error, {
        patientId,
        observationId: observationToDelete.id,
      });
      setPageFeedback({
        type: 'error',
        message: t('patients.file.observationDeleteError'),
      });
    } finally {
      setIsDeletingObservation(false);
    }
  };

  return {
    newNote,
    setNewNote,
    isSavingNote,
    editingObservation,
    setEditingObservation,
    editingObservationNote,
    setEditingObservationNote,
    isUpdatingObservation,
    observationToDelete,
    setObservationToDelete,
    isDeletingObservation,
    handleSaveObservation,
    handleStartEditObservation,
    resetEditingObservation,
    handleUpdateObservation,
    handleDeleteObservation,
  };
};
