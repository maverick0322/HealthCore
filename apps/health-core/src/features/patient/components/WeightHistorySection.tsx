import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, TrendingDown, Trash2 } from 'lucide-react';

import { useDeleteWeightRecord } from '@/features/patient/hooks/useDeleteWeightRecord';
import { useEditWeightRecord } from '@/features/patient/hooks/useEditWeightRecord';
import { useWeightHistory } from '@/features/patient/hooks/useWeightHistory';
import { useWeightHistoryChart } from '@/features/patient/hooks/useWeightHistoryChart';
import type { WeightRecord } from '@/features/clinical/types/clinical.types';
import { todayDateKey } from '@/features/agenda/utils/agendaDateUtils';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { getWeightValidationErrors, type WeightTableRow } from '@/features/patient/utils/weightHistory';
import { formatLongDate } from '@/features/patient/utils/weightHistoryPresentation';
import { WeightHistoryTrendPanel } from '@/features/patient/components/WeightHistoryTrendPanel';
import { WeightHistoryRecordsTable } from '@/features/patient/components/WeightHistoryRecordsTable';

const WEIGHT_INPUT_MAX_LENGTH = 5;

interface WeightHistorySectionProps {
  records?: WeightRecord[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  readOnly?: boolean;
  headerAction?: ReactNode;
}

export const WeightHistorySection = ({
  records,
  isLoading: externalIsLoading,
  isError: externalIsError,
  onRetry,
  readOnly = false,
  headerAction,
}: Readonly<WeightHistorySectionProps> = {}) => {
  const { t, i18n } = useTranslation('patient');
  const usesExternalRecords = records !== undefined;
  const { data, isLoading, isError, refetch } = useWeightHistory({ enabled: !usesExternalRecords });
  const editWeightRecord = useEditWeightRecord();
  const deleteWeightRecord = useDeleteWeightRecord();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<WeightTableRow | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(todayDateKey());
  const [fieldErrors, setFieldErrors] = useState<{ weightKg?: string; date?: string }>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const sourceRecords = usesExternalRecords ? records : data;
  const resolvedIsLoading = usesExternalRecords ? Boolean(externalIsLoading) : isLoading;
  const resolvedIsError = usesExternalRecords ? Boolean(externalIsError) : isError;
  const handleRetry = usesExternalRecords ? onRetry : () => refetch();
  const canManageRecords = !readOnly && !usesExternalRecords;

  const {
    chartHostRef,
    range,
    setRange,
    allRecords,
    filteredRecords,
    rangeStates,
    rangeWindow,
    tableRows,
    periodStats,
    chart,
    visibleTickIndexes,
    latestDateLabel,
    summaryTranslationKey,
    summaryParams,
  } = useWeightHistoryChart({
    records: sourceRecords,
    locale: i18n.language,
  });

  const resetEditFlow = () => {
    setEditDialogOpen(false);
    setConfirmEditOpen(false);
    setSelectedRow(null);
    setWeightInput('');
    setDateInput(todayDateKey());
    setFieldErrors({});
    setActionError(null);
  };

  const openEditFlow = (row: WeightTableRow) => {
    setSelectedRow(row);
    setWeightInput(row.weightKg.toFixed(1));
    setDateInput(row.date);
    setFieldErrors({});
    setActionError(null);
    setDeleteConfirmOpen(false);
    setConfirmEditOpen(false);
    setEditDialogOpen(true);
  };

  const handleReviewEdit = () => {
    const validationErrors = getWeightValidationErrors(weightInput, dateInput, t);
    setFieldErrors(validationErrors);
    setActionError(null);

    if (validationErrors.weightKg || validationErrors.date) {
      return;
    }

    setEditDialogOpen(false);
    setConfirmEditOpen(true);
  };

  const handleBackToEdit = () => {
    setConfirmEditOpen(false);
    setEditDialogOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!selectedRow) {
      return;
    }

    try {
      await editWeightRecord.mutateAsync({
        originalDate: selectedRow.date,
        weightKg: Number(weightInput),
        date: dateInput,
      });
      resetEditFlow();
    } catch (error: any) {
      setConfirmEditOpen(false);
      setEditDialogOpen(true);
      setActionError(error?.response?.data?.message ?? t('history.actions.updateError'));
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) {
      return;
    }

    try {
      await deleteWeightRecord.mutateAsync(selectedRow.date);
      setDeleteConfirmOpen(false);
      setSelectedRow(null);
      setActionError(null);
    } catch (error: any) {
      setDeleteConfirmOpen(false);
      setActionError(error?.response?.data?.message ?? t('history.actions.deleteError'));
    }
  };

  return (
    <>
      <Card id="card-history-weight">
        <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingDown size={16} className="text-primary" />
            {t('history.weightProgressTitle')}
          </CardTitle>
          {headerAction ? <div className="flex shrink-0 items-center">{headerAction}</div> : null}
        </CardHeader>
        <CardContent className="space-y-5">
          {resolvedIsLoading ? (
            <div className="space-y-4">
              <div className="h-16 rounded-xl bg-muted animate-pulse" />
              <div className="h-80 rounded-2xl bg-muted animate-pulse" />
              <div className="h-48 rounded-2xl bg-muted animate-pulse" />
            </div>
          ) : resolvedIsError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
              <p className="text-destructive">{t('history.weightErrorMessage')}</p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => handleRetry?.()}>
                {t('common.retry')}
              </Button>
            </div>
          ) : allRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">{t('history.noWeightEntries')}</p>
            </div>
          ) : (
            <>
              <WeightHistoryTrendPanel
                locale={i18n.language}
                range={range}
                rangeStates={rangeStates}
                rangeWindow={rangeWindow}
                filteredRecordsLength={filteredRecords.length}
                periodStats={periodStats}
                latestDateLabel={latestDateLabel}
                summaryTranslationKey={summaryTranslationKey}
                summaryParams={summaryParams}
                actionError={actionError}
                chartHostRef={chartHostRef}
                chart={chart}
                visibleTickIndexes={visibleTickIndexes}
                onRangeChange={setRange}
              />

              <WeightHistoryRecordsTable
                rows={tableRows}
                canManageRecords={canManageRecords}
                totalRecords={allRecords.length}
                onEditRow={openEditFlow}
                onDeleteRow={(row) => {
                  setSelectedRow(row);
                  setActionError(null);
                  setDeleteConfirmOpen(true);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {canManageRecords ? (
        <Dialog open={editDialogOpen} onOpenChange={(open) => (open ? setEditDialogOpen(true) : resetEditFlow())}>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>{t('history.editDialog.title')}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="history-weight-kg-input">{t('dashboard.weightForm.weightLabel')}</Label>
                <Input
                  id="history-weight-kg-input"
                  inputMode="decimal"
                  placeholder={t('dashboard.weightForm.weightPlaceholder')}
                  value={weightInput}
                  maxLength={WEIGHT_INPUT_MAX_LENGTH}
                  onChange={(event) => setWeightInput(event.target.value.slice(0, WEIGHT_INPUT_MAX_LENGTH))}
                  aria-invalid={Boolean(fieldErrors.weightKg)}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-destructive">{fieldErrors.weightKg ?? ''}</p>
                  <p className="text-xs text-muted-foreground">
                    {weightInput.length}/{WEIGHT_INPUT_MAX_LENGTH}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="history-weight-date-input">{t('dashboard.weightForm.dateLabel')}</Label>
                <Input
                  id="history-weight-date-input"
                  type="date"
                  value={dateInput}
                  max={todayDateKey()}
                  onChange={(event) => setDateInput(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.date)}
                />
                {fieldErrors.date ? <p className="text-xs text-destructive">{fieldErrors.date}</p> : null}
              </div>

              {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetEditFlow}
                disabled={editWeightRecord.isPending}
              >
                {t('dashboard.weightForm.cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleReviewEdit}
                disabled={editWeightRecord.isPending}
              >
                {t('history.editDialog.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {canManageRecords ? (
        <ConfirmModal
          isOpen={confirmEditOpen}
          onClose={handleBackToEdit}
          onConfirm={() => {
            void handleConfirmEdit();
          }}
          title={t('history.editDialog.confirmTitle')}
          description={t('history.editDialog.confirmDescription', {
            weight: Number(weightInput || 0).toFixed(1),
            date: formatLongDate(dateInput, i18n.language),
          })}
          confirmText={t('history.editDialog.confirmAction')}
          cancelText={t('dashboard.weightForm.back')}
          icon={<Pencil size={20} />}
          isLoading={editWeightRecord.isPending}
        />
      ) : null}

      {canManageRecords ? (
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={() => {
            void handleDelete();
          }}
          title={t('history.deleteDialog.title')}
          description={t('history.deleteDialog.description', {
            date: selectedRow ? formatLongDate(selectedRow.date, i18n.language) : t('history.noDate'),
            weight: selectedRow ? selectedRow.weightKg.toFixed(1) : '--',
          })}
          confirmText={t('history.deleteDialog.confirmAction')}
          cancelText={t('dashboard.weightForm.cancel')}
          icon={<Trash2 size={20} />}
          isLoading={deleteWeightRecord.isPending}
          isDestructive
        />
      ) : null}
    </>
  );
};
