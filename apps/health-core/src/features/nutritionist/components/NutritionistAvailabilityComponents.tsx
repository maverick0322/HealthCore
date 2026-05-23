import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type React from 'react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { formatLocalDate, formatLocalTime } from '@/features/agenda/utils/agendaDateUtils';
import type { AvailabilitySlotResponse, GenerateSlotsTimeBlock } from '../types/agenda.types';

// ── DeactivateSlotDialog ──────────────────────────────────────────────────────

interface DeactivateSlotDialogProps {
  target: AvailabilitySlotResponse | null;
  deactivating: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeactivateSlotDialog = ({
  target,
  deactivating,
  onClose,
  onConfirm,
}: DeactivateSlotDialogProps) => {
  const { t } = useTranslation('nutritionist');

  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('availability.deactivateTitle')}</DialogTitle>
          <DialogDescription>{t('availability.deactivateConfirm')}</DialogDescription>
        </DialogHeader>
        {target && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium">{formatLocalDate(target.startTime)}</p>
            <p className="text-muted-foreground">
              {formatLocalTime(target.startTime)} - {formatLocalTime(target.endTime)}
            </p>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>{t('availability.close')}</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deactivating}>
            {deactivating ? (
              <>
                <Loader2 size={14} className="animate-spin mr-2" />
                {t('availability.deactivating')}
              </>
            ) : (
              t('availability.deactivateBtn')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── DayBlockEditor ───────────────────────────────────────────────────────────

interface DayBlockEditorProps {
  dateKey: string;
  blocks: GenerateSlotsTimeBlock[];
  earliestTime: string;
  latestTime: string;
  onUpdateBlock: (index: number, field: keyof GenerateSlotsTimeBlock, value: string) => void;
  onAddBlock: () => void;
  onRemoveBlock: (index: number) => void;
}

export const DayBlockEditor = ({
  dateKey,
  blocks,
  earliestTime,
  latestTime,
  onUpdateBlock,
  onAddBlock,
  onRemoveBlock,
}: DayBlockEditorProps) => {
  const { t } = useTranslation('nutritionist');

  return (
    <section className="rounded-lg border border-border bg-background p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{formatLocalDate(dateKey)}</p>
        <Button type="button" variant="outline" size="sm" onClick={onAddBlock}>
          <Plus size={14} className="mr-1.5" />
          {t('availability.addBlock')}
        </Button>
      </div>

      <div className="space-y-2">
        {blocks.map((block, index) => (
          <div key={`${dateKey}-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Input
              type="time"
              min={earliestTime}
              max={latestTime}
              value={block.startTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateBlock(index, 'startTime', e.target.value)}
            />
            <Input
              type="time"
              min={earliestTime}
              max={latestTime}
              value={block.endTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateBlock(index, 'endTime', e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemoveBlock(index)}
              disabled={blocks.length === 1}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
};

// ── DaySelector ─────────────────────────────────────────────────────────────

interface DaySelectorProps {
  dateKeys: string[];
  selectedDays: string[];
  todayDateKey: string;
  onToggleDay: (dateKey: string) => void;
}

export const DaySelector = ({
  dateKeys,
  selectedDays,
  todayDateKey,
  onToggleDay,
}: DaySelectorProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {dateKeys.map((dateKey) => {
        const selected = selectedDays.includes(dateKey);
        const disabled = dateKey < todayDateKey;
        return (
          <button
            key={dateKey}
            type="button"
            disabled={disabled}
            onClick={() => onToggleDay(dateKey)}
            className={`rounded-lg border px-3 py-3 text-left text-sm transition-all disabled:cursor-not-allowed ${disabled
                ? 'border-border bg-muted/60 text-muted-foreground/60'
                : selected
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-border bg-background hover:border-primary/50'
              }`}
          >
            <span className="block font-semibold">{formatLocalDate(dateKey)}</span>
          </button>
        );
      })}
    </div>
  );
};
