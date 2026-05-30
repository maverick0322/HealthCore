import { useTranslation } from 'react-i18next';
import { Pencil, Scale, Trash2 } from 'lucide-react';

import type { WeightTableRow } from '@/features/patient/utils/weightHistory';
import { formatVariation, formatWeight } from '@/features/patient/utils/weightHistoryPresentation';
import { Button } from '@/shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

interface WeightHistoryRecordsTableProps {
  rows: WeightTableRow[];
  canManageRecords: boolean;
  totalRecords: number;
  onEditRow: (row: WeightTableRow) => void;
  onDeleteRow: (row: WeightTableRow) => void;
}

export function WeightHistoryRecordsTable({
  rows,
  canManageRecords,
  totalRecords,
  onEditRow,
  onDeleteRow,
}: Readonly<WeightHistoryRecordsTableProps>) {
  const { t } = useTranslation('patient');

  return (
    <div className="rounded-2xl border border-border/70 bg-background">
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <Scale size={15} className="text-primary" />
        <p className="text-sm font-semibold">{t('history.previousRecordsTitle')}</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('history.table.date')}</TableHead>
            <TableHead>{t('history.table.weight')}</TableHead>
            <TableHead>{t('history.table.variation')}</TableHead>
            {canManageRecords ? <TableHead>{t('history.table.actions')}</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.date}>
              <TableCell>{row.label}</TableCell>
              <TableCell>{formatWeight(row.weightKg)}</TableCell>
              <TableCell>{formatVariation(row.variationKg)}</TableCell>
              {canManageRecords ? (
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => onEditRow(row)}>
                      <Pencil size={14} />
                      {t('history.actions.edit')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onDeleteRow(row)}
                      disabled={totalRecords <= 1}
                      title={totalRecords <= 1 ? t('history.actions.deleteDisabled') : undefined}
                    >
                      <Trash2 size={14} />
                      {t('history.actions.delete')}
                    </Button>
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
