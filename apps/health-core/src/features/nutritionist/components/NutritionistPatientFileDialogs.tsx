import { useTranslation } from 'react-i18next';
import { Loader2, SquarePen, Trash2, UserMinus } from 'lucide-react';

import { CreateLocalFoodModal } from '@/features/admin/components/CreateLocalFoodModal';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

interface NutritionistPatientFileDialogsProps {
  showUnlinkModal: boolean;
  onCloseUnlinkModal: () => void;
  onConfirmUnlink: () => void;
  isUnlinking: boolean;
  observationToDelete: { note?: string } | null;
  onCloseDeleteObservation: () => void;
  onConfirmDeleteObservation: () => void;
  isDeletingObservation: boolean;
  editMetricsOpen: boolean;
  onChangeEditMetricsOpen: (open: boolean) => void;
  metricsWeightInput: string;
  metricsHeightInput: string;
  metricsErrors: { weightKg?: string; heightCm?: string };
  onChangeMetricsWeightInput: (value: string) => void;
  onChangeMetricsHeightInput: (value: string) => void;
  onResetMetricsDialog: () => void;
  onReviewMetricsUpdate: () => void;
  isUpdatingMetrics: boolean;
  weightInputMaxLength: number;
  heightInputMaxLength: number;
  confirmEditMetricsOpen: boolean;
  onCloseConfirmMetrics: () => void;
  onConfirmMetricsUpdate: () => void;
  editingObservation: { id: string } | null;
  editingObservationNote: string;
  onChangeEditingObservationNote: (value: string) => void;
  onCloseEditObservation: () => void;
  onConfirmEditObservation: () => void;
  isUpdatingObservation: boolean;
  observationNoteMaxLength: number;
  isCreateFoodModalOpen: boolean;
  onCloseCreateFoodModal: () => void;
  suggestedFoodName: string;
  onCreateFoodSuccess: () => void;
}

export function NutritionistPatientFileDialogs({
  showUnlinkModal,
  onCloseUnlinkModal,
  onConfirmUnlink,
  isUnlinking,
  observationToDelete,
  onCloseDeleteObservation,
  onConfirmDeleteObservation,
  isDeletingObservation,
  editMetricsOpen,
  onChangeEditMetricsOpen,
  metricsWeightInput,
  metricsHeightInput,
  metricsErrors,
  onChangeMetricsWeightInput,
  onChangeMetricsHeightInput,
  onResetMetricsDialog,
  onReviewMetricsUpdate,
  isUpdatingMetrics,
  weightInputMaxLength,
  heightInputMaxLength,
  confirmEditMetricsOpen,
  onCloseConfirmMetrics,
  onConfirmMetricsUpdate,
  editingObservation,
  editingObservationNote,
  onChangeEditingObservationNote,
  onCloseEditObservation,
  onConfirmEditObservation,
  isUpdatingObservation,
  observationNoteMaxLength,
  isCreateFoodModalOpen,
  onCloseCreateFoodModal,
  suggestedFoodName,
  onCreateFoodSuccess,
}: Readonly<NutritionistPatientFileDialogsProps>) {
  const { t } = useTranslation('nutritionist');

  return (
    <>
      <ConfirmModal
        isOpen={showUnlinkModal}
        onClose={onCloseUnlinkModal}
        onConfirm={onConfirmUnlink}
        title={t('patients.file.unlinkTitle')}
        description={t('patients.file.confirmUnlink')}
        icon={<UserMinus size={24} />}
        isLoading={isUnlinking}
        isDestructive
        confirmText={t('patients.file.unlink')}
        cancelText={t('common.cancel')}
      />

      <ConfirmModal
        isOpen={Boolean(observationToDelete)}
        onClose={onCloseDeleteObservation}
        onConfirm={onConfirmDeleteObservation}
        title={t('patients.file.deleteObservationTitle')}
        description={t('patients.file.deleteObservationDescription', {
          note: observationToDelete?.note ?? '',
        })}
        icon={<Trash2 size={24} />}
        isLoading={isDeletingObservation}
        isDestructive
        confirmText={t('patients.file.deleteObservation')}
        cancelText={t('common.cancel')}
      />

      <Dialog open={editMetricsOpen} onOpenChange={onChangeEditMetricsOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('patients.file.metrics.title')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="metrics-weight" className="text-sm font-medium">
                {t('patients.file.metrics.weightLabel')}
              </label>
              <Input
                id="metrics-weight"
                inputMode="decimal"
                value={metricsWeightInput}
                maxLength={weightInputMaxLength}
                onChange={(event) => onChangeMetricsWeightInput(event.target.value.slice(0, weightInputMaxLength))}
                aria-invalid={Boolean(metricsErrors.weightKg)}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-destructive">{metricsErrors.weightKg ?? ''}</p>
                <p className="text-xs text-muted-foreground">
                  {metricsWeightInput.length}/{weightInputMaxLength}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="metrics-height" className="text-sm font-medium">
                {t('patients.file.metrics.heightLabel')}
              </label>
              <Input
                id="metrics-height"
                inputMode="numeric"
                value={metricsHeightInput}
                maxLength={heightInputMaxLength}
                onChange={(event) => onChangeMetricsHeightInput(event.target.value.slice(0, heightInputMaxLength))}
                aria-invalid={Boolean(metricsErrors.heightCm)}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-destructive">{metricsErrors.heightCm ?? ''}</p>
                <p className="text-xs text-muted-foreground">
                  {metricsHeightInput.length}/{heightInputMaxLength}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onResetMetricsDialog} disabled={isUpdatingMetrics}>
              {t('patients.file.metrics.cancel')}
            </Button>
            <Button type="button" onClick={onReviewMetricsUpdate} disabled={isUpdatingMetrics}>
              {t('patients.file.metrics.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={confirmEditMetricsOpen}
        onClose={onCloseConfirmMetrics}
        onConfirm={onConfirmMetricsUpdate}
        title={t('patients.file.metrics.confirmTitle')}
        description={t('patients.file.metrics.confirmDescription', {
          weight: metricsWeightInput || '--',
          height: metricsHeightInput || '--',
        })}
        icon={<SquarePen size={24} />}
        isLoading={isUpdatingMetrics}
        confirmText={t('patients.file.metrics.save')}
        cancelText={t('patients.file.metrics.back')}
      />

      <Dialog
        open={Boolean(editingObservation)}
        onOpenChange={(open) => {
          if (!open) {
            onCloseEditObservation();
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('patients.file.editObservationTitle')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-foreground">{t('patients.file.editObservationTitle')}</p>
              <span className="text-xs text-muted-foreground">
                {editingObservationNote.length}/{observationNoteMaxLength}
              </span>
            </div>
            <Textarea
              value={editingObservationNote}
              onChange={(event) => onChangeEditingObservationNote(event.target.value)}
              disabled={isUpdatingObservation}
              maxLength={observationNoteMaxLength}
              className="min-h-[140px] resize-y bg-background"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCloseEditObservation}
              disabled={isUpdatingObservation}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={onConfirmEditObservation}
              disabled={isUpdatingObservation || !editingObservationNote.trim()}
            >
              {isUpdatingObservation ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              {t('patients.file.saveObservationChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateLocalFoodModal
        isOpen={isCreateFoodModalOpen}
        onClose={onCloseCreateFoodModal}
        initialName={suggestedFoodName}
        onSuccess={onCreateFoodSuccess}
      />
    </>
  );
}
