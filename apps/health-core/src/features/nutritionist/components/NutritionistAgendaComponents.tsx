import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatLocalDate, formatLocalTime } from '@/features/agenda/utils/agendaDateUtils';
import type { NutritionistPatientProfileResponse } from '@/features/clinical/types/clinical.types';
import type { AppointmentResponse, AvailabilitySlotResponse } from '../types/agenda.types';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

interface BookAppointmentDialogProps {
  target: AvailabilitySlotResponse | null;
  patients: NutritionistPatientProfileResponse[];
  selectedPatientId: string;
  booking: boolean;
  onSelectPatient: (patientId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const BookAppointmentDialog = ({
  target,
  patients,
  selectedPatientId,
  booking,
  onSelectPatient,
  onClose,
  onConfirm,
}: BookAppointmentDialogProps) => {
  const { t } = useTranslation('nutritionist');

  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('agenda.bookForPatientTitle')}</DialogTitle>
          <DialogDescription>{t('agenda.bookForPatientConfirm')}</DialogDescription>
        </DialogHeader>
        {target && (
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium">{formatLocalDate(target.startTime)}</p>
              <p className="text-muted-foreground">
                {formatLocalTime(target.startTime)} - {formatLocalTime(target.endTime)}
              </p>
            </div>
            {patients.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('agenda.noLinkedPatients')}</p>
            ) : (
              <label className="block text-sm space-y-2">
                <span className="font-medium">{t('agenda.selectPatient')}</span>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={selectedPatientId}
                  onChange={(event) => onSelectPatient(event.target.value)}
                >
                  {patients.map((patient) => (
                    <option key={patient.userId} value={patient.userId}>
                      {patient.fullName?.trim() || patient.userId}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>{t('availability.close')}</Button>
          <Button onClick={onConfirm} disabled={booking || patients.length === 0 || !selectedPatientId}>
            {booking ? (
              <>
                <Loader2 size={14} className="animate-spin mr-2" />
                {t('agenda.booking')}
              </>
            ) : (
              t('agenda.bookForPatientBtn')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface CancelAppointmentDialogProps {
  target: AppointmentResponse | null;
  patientDisplayName: string | null;
  cancelling: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelAppointmentDialog = ({
  target,
  patientDisplayName,
  cancelling,
  onClose,
  onConfirm,
}: CancelAppointmentDialogProps) => {
  const { t } = useTranslation('nutritionist');

  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('agenda.cancelTitle')}</DialogTitle>
          <DialogDescription>{t('agenda.cancelConfirm')}</DialogDescription>
        </DialogHeader>
        {target && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium">{formatLocalDate(target.startTime)}</p>
            <p className="text-muted-foreground">
              {formatLocalTime(target.startTime)} - {formatLocalTime(target.endTime)}
            </p>
            <p className="text-muted-foreground">
              {t('dashboard.patient')}: {patientDisplayName || target.patientId}
            </p>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>{t('availability.close')}</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={cancelling}>
            {cancelling ? (
              <>
                <Loader2 size={14} className="animate-spin mr-2" />
                {t('agenda.cancelling')}
              </>
            ) : (
              t('agenda.cancelBtn')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
