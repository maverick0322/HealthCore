import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  LogOut,
  Pencil,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface PatientProfileActionsCardProps {
  userProvider?: string | null;
  hasProfile: boolean;
  nutritionistId?: string | null;
  isUnlinking: boolean;
  unlinkFeedback: { type: 'success' | 'error'; message: string } | null;
  onChangePassword: () => void;
  onOpenLinkNutritionist: () => void;
  onOpenUnlinkNutritionist: () => void;
}

export function PatientProfileActionsCard({
  userProvider,
  hasProfile,
  nutritionistId,
  isUnlinking,
  unlinkFeedback,
  onChangePassword,
  onOpenLinkNutritionist,
  onOpenUnlinkNutritionist,
}: Readonly<PatientProfileActionsCardProps>) {
  const { t } = useTranslation('patient');

  return (
    <Card id="card-account-actions">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Pencil size={16} className="text-primary" />
          {t('profile.actionsSection')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pb-2">
        {unlinkFeedback ? (
          <div
            className={`mb-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
              unlinkFeedback.type === 'success'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-destructive/25 bg-destructive/10 text-destructive'
            }`}
          >
            {unlinkFeedback.type === 'success' ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
            )}
            <span>{unlinkFeedback.message}</span>
          </div>
        ) : null}

        {(!userProvider || userProvider === 'LOCAL') && (
          <ActionRow
            id="btn-change-password"
            icon={<KeyRound size={16} className="text-primary" />}
            label={t('profile.changePassword')}
            desc={t('profile.changePasswordDesc')}
            onClick={onChangePassword}
          />
        )}

        {hasProfile ? (
          nutritionistId ? (
            <ActionRow
              id="btn-unlink-nutritionist"
              icon={<LogOut size={16} />}
              label={t('linking.unlinkNutritionist')}
              desc={t('linking.unlinkDesc')}
              variant="destructive"
              onClick={() => {
                if (!isUnlinking) {
                  onOpenUnlinkNutritionist();
                }
              }}
            />
          ) : (
            <ActionRow
              id="btn-link-nutritionist"
              icon={<Camera size={16} />}
              label={t('linking.linkNutritionist')}
              desc={t('linking.linkDesc')}
              onClick={onOpenLinkNutritionist}
            />
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

interface ActionRowProps {
  id: string;
  icon: ReactNode;
  label: string;
  desc?: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive';
}

function ActionRow({ id, icon, label, desc, onClick, variant = 'default' }: Readonly<ActionRowProps>) {
  return (
    <button
      id={id}
      type="button"
      className="w-full flex items-center gap-3 py-3 px-1 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors text-left group"
      onClick={onClick}
      disabled={!onClick}
      aria-label={label}
    >
      <span
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
        }`}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{label}</p>
        {desc ? <p className="text-xs text-muted-foreground truncate">{desc}</p> : null}
      </div>
      <ChevronRight
        size={16}
        className="text-muted-foreground flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
      />
    </button>
  );
}
