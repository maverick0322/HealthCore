import { useTranslation } from 'react-i18next';
import { FileText, Loader2, Pencil, Trash2 } from 'lucide-react';

import type { ObservationResponse } from '@/features/clinical/types/clinical.types';
import { formatObservationDateTime } from '@/features/nutritionist/utils/patientFilePresentation';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Textarea } from '@/shared/ui/textarea';

interface NutritionistPatientObservationsTabProps {
  newNote: string;
  onChangeNewNote: (value: string) => void;
  isSavingNote: boolean;
  onSaveObservation: () => void;
  observations: ObservationResponse[];
  onEditObservation: (observation: ObservationResponse) => void;
  onDeleteObservation: (observation: ObservationResponse) => void;
  locale: string;
  maxNoteLength: number;
}

export const NutritionistPatientObservationsTab = ({
  newNote,
  onChangeNewNote,
  isSavingNote,
  onSaveObservation,
  observations,
  onEditObservation,
  onDeleteObservation,
  locale,
  maxNoteLength,
}: NutritionistPatientObservationsTabProps) => {
  const { t } = useTranslation('nutritionist');

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText size={18} className="text-primary" /> {t('patients.file.tabObservations')}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-5 space-y-8">
        <div className="bg-muted/10 p-4 rounded-xl border border-border/50 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground">{t('patients.file.newNote')}</p>
            <span className="text-xs text-muted-foreground">
              {newNote.length}/{maxNoteLength}
            </span>
          </div>
          <Textarea
            value={newNote}
            onChange={(event) => onChangeNewNote(event.target.value)}
            disabled={isSavingNote}
            placeholder={t('patients.file.newNotePlaceholder')}
            maxLength={maxNoteLength}
            className="min-h-[80px] resize-y bg-background"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={onSaveObservation}
              disabled={isSavingNote || !newNote.trim()}
              className="flex items-center gap-2"
            >
              {isSavingNote && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('patients.file.saveObservation')}
            </Button>
          </div>
        </div>

        <div className="relative border-l-2 border-border/50 ml-3 space-y-6">
          {observations.length === 0 ? (
            <p className="text-sm text-muted-foreground italic pl-4">
              {t('patients.file.noObservations')}
            </p>
          ) : (
            observations.map((observation) => (
              <div key={observation.id} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary" />

                <p className="text-xs font-bold text-muted-foreground mb-1">
                  {formatObservationDateTime(observation.createdAt, locale)}
                </p>

                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <p className="flex-1 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {observation.note}
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onEditObservation(observation)}
                      >
                        <Pencil size={14} />
                        {t('patients.file.editObservation')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteObservation(observation)}
                      >
                        <Trash2 size={14} />
                        {t('patients.file.deleteObservation')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
