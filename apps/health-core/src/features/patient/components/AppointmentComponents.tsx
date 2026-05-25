import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type React from 'react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  formatLocalDate,
  formatLocalDateTime,
  formatLocalTime,
  todayDateKey,
} from '@/features/agenda/utils/agendaDateUtils';
import type { AppointmentResponse, AvailabilitySlotResponse } from '../types/agenda.types';

// ── Status helpers ────────────────────────────────────────────────────────────

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'CONFIRMED':
    case 'ATTENDED':
      return <CheckCircle2 size={14} className="text-emerald-500" />;
    case 'CANCELLED':
      return <XCircle size={14} className="text-destructive" />;
    default:
      return <Clock size={14} className="text-amber-500" />;
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
    case 'ATTENDED':
      return 'text-emerald-500';
    case 'CANCELLED':
      return 'text-destructive';
    default:
      return 'text-amber-500';
  }
};

// ── AppointmentListItem ───────────────────────────────────────────────────────

interface AppointmentListItemProps {
  appointment: AppointmentResponse;
  onCancel: (appt: AppointmentResponse) => void;
  onReschedule: (appt: AppointmentResponse) => void;
  showActions?: boolean;
}

export const AppointmentListItem = ({
  appointment,
  onCancel,
  onReschedule,
  showActions = true,
}: AppointmentListItemProps) => {
  const { t } = useTranslation('patient');
  const canAct = showActions && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED');

  return (
    <div className="p-4 hover:bg-muted/30 transition-colors">
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-sm">{formatLocalDateTime(appointment.startTime)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatLocalTime(appointment.startTime)} - {formatLocalTime(appointment.endTime)}
          </p>
        </div>
        <div className={`flex items-center gap-1.5 bg-background border px-2 py-1 rounded-md text-xs font-medium ${statusColor(appointment.status)}`}>
          <StatusIcon status={appointment.status} />
          {t(`appointments.status.${appointment.status}`)}
        </div>
      </div>

      {canAct && (
        <div className="flex gap-2 mt-3">
          <Button
            id={`btn-cancel-${appointment.id}`}
            size="sm"
            variant="destructive"
            className="text-xs h-7"
            onClick={() => onCancel(appointment)}
          >
            <XCircle size={13} className="mr-1" />
            {t('appointments.cancelBtn')}
          </Button>
          <Button
            id={`btn-reschedule-${appointment.id}`}
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={() => onReschedule(appointment)}
          >
            <RefreshCw size={13} className="mr-1" />
            {t('appointments.rescheduleBtn')}
          </Button>
        </div>
      )}
    </div>
  );
};

// ── SlotBookingCard ───────────────────────────────────────────────────────────

interface SlotBookingCardProps {
  slot: AvailabilitySlotResponse;
  booking: boolean;
  onBook: () => void;
}

export const SlotBookingCard = ({ slot, booking, onBook }: SlotBookingCardProps) => {
  const { t } = useTranslation('patient');

  return (
    <Card>
      <CardContent className="pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{formatLocalDate(slot.startTime)}</p>
          <p className="text-sm text-muted-foreground">
            {formatLocalTime(slot.startTime)} - {formatLocalTime(slot.endTime)}
          </p>
        </div>
        <Button id="btn-book-slot" onClick={onBook} disabled={booking}>
          {booking ? (
            <>
              <Loader2 size={14} className="animate-spin mr-2" />
              {t('appointments.booking')}
            </>
          ) : (
            t('appointments.bookSlot')
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

// ── CancelAppointmentDialog ───────────────────────────────────────────────────

interface CancelAppointmentDialogProps {
  target: AppointmentResponse | null;
  cancelling: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelAppointmentDialog = ({
  target,
  cancelling,
  onClose,
  onConfirm,
}: CancelAppointmentDialogProps) => {
  const { t } = useTranslation('patient');

  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('appointments.cancelTitle')}</DialogTitle>
          <DialogDescription>{t('appointments.cancelConfirm')}</DialogDescription>
        </DialogHeader>
        {target && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium">{formatLocalDateTime(target.startTime)}</p>
            <p className="text-muted-foreground">
              {formatLocalTime(target.startTime)} - {formatLocalTime(target.endTime)}
            </p>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>{t('appointments.close')}</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={cancelling}>
            {cancelling ? (
              <>
                <Loader2 size={14} className="animate-spin mr-2" />
                {t('appointments.cancelling')}
              </>
            ) : (
              t('appointments.cancelBtn')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── RescheduleAppointmentDialog ───────────────────────────────────────────────

interface RescheduleAppointmentDialogProps {
  target: AppointmentResponse | null;
  rescheduleSlot: AvailabilitySlotResponse | null;
  rescheduling: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}

export const RescheduleAppointmentDialog = ({
  target,
  rescheduleSlot,
  rescheduling,
  onClose,
  onConfirm,
  children,
}: RescheduleAppointmentDialogProps) => {
  const { t } = useTranslation('patient');

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogContent className="max-h-[92dvh] max-w-[min(95vw,900px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('appointments.rescheduleTitle')}</DialogTitle>
          <DialogDescription>{t('appointments.rescheduleSelectSlot')}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>{t('appointments.close')}</Button>
          <Button onClick={onConfirm} disabled={!rescheduleSlot || rescheduling}>
            {rescheduling ? (
              <>
                <Loader2 size={14} className="animate-spin mr-2" />
                {t('appointments.rescheduling')}
              </>
            ) : (
              t('appointments.rescheduleBtn')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── LinkedNutritionistBanner ──────────────────────────────────────────────────

interface LinkedNutritionistBannerProps {
  loadingProfile: boolean;
  profileError: string | null;
  linkedNutritionistId: string | null;
  nutritionistName: string;
  nutritionistSpecializations: string[];
  selectedDate: string;
  loadingSlots: boolean;
  onDateChange: (date: string) => void;
  onSearchSlots: () => void;
  onLinkNutritionist: () => void;
}

export const LinkedNutritionistBanner = ({
  loadingProfile,
  profileError,
  linkedNutritionistId,
  nutritionistName,
  nutritionistSpecializations,
  selectedDate,
  loadingSlots,
  onDateChange,
  onSearchSlots,
  onLinkNutritionist,
}: LinkedNutritionistBannerProps) => {
  const { t } = useTranslation('patient');

  if (loadingProfile) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <Loader2 size={16} className="animate-spin" />
        {t('appointments.loadingProfile')}
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <span>{profileError}</span>
      </div>
    );
  }

  if (!linkedNutritionistId) {
    return (
      <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-3">
        <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t('appointments.noLinkedNutritionist')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('appointments.noLinkedNutritionistDesc')}</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onLinkNutritionist}>
          {t('appointments.linkNutritionistAction')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 px-3 py-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase text-muted-foreground">{t('appointments.assignedNutritionist')}</p>
        <p className="mt-1 text-sm font-semibold text-foreground">{nutritionistName}</p>
        {nutritionistSpecializations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {nutritionistSpecializations.map((spec) => (
              <span
                key={spec}
                className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {spec}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2 lg:w-56">
        <Label htmlFor="appointment-date">{t('appointments.date')}</Label>
        <Input
          id="appointment-date"
          type="date"
          min={todayDateKey()}
          value={selectedDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onDateChange(e.target.value)}
        />
      </div>
      <Button id="btn-search-slots" onClick={onSearchSlots} disabled={loadingSlots}>
        {loadingSlots ? (
          <>
            <Loader2 size={14} className="animate-spin mr-2" />
            {t('appointments.loadingSlots')}
          </>
        ) : (
          <>
            <Search size={14} className="mr-2" />
            {t('appointments.searchSlots')}
          </>
        )}
      </Button>
    </div>
  );
};
