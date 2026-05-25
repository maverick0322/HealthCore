import type { NutritionistWeightProgressReportResponse } from '@/features/clinical/types/clinical.types';
import type { NutritionistAppointmentSummary } from '@/features/nutritionist/types/report.types';

interface NutritionistReportPdfLabels {
  title: string;
  generatedOn: string;
  activeRange: string;
  rangeWindow: string;
  sections: {
    overview: string;
    appointments: string;
    weightTable: string;
  };
  kpis: {
    totalPatients: string;
    attendedAppointments: string;
  };
  appointments: {
    attended: string;
    cancelled: string;
    empty: string;
    helper: string;
  };
  weightTable: {
    noRecords: string;
    empty: string;
    summary: string;
    columns: {
      patient: string;
      latestRecord: string;
      startWeight: string;
      currentWeight: string;
      netChange: string;
    };
  };
}

interface ExportNutritionistReportPdfOptions {
  fileName: string;
  locale: string;
  labels: NutritionistReportPdfLabels;
  activeRangeLabel: string;
  activeRangeWindowText: string;
  appointmentSummaryText: string;
  appointmentSummary: NutritionistAppointmentSummary;
  weightReport: NutritionistWeightProgressReportResponse;
}

const formatDate = (value: string | null, locale: string) => {
  if (!value) {
    return null;
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatWeight = (value: number | null | undefined) =>
  value == null ? '--' : `${value.toFixed(1)} kg`;

const formatWeightChange = (value: number | null | undefined) => {
  if (value == null) {
    return '--';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} kg`;
};

export const exportNutritionistReportPdf = async ({
  fileName,
  locale,
  labels,
  activeRangeLabel,
  activeRangeWindowText,
  appointmentSummaryText,
  appointmentSummary,
  weightReport,
}: ExportNutritionistReportPdfOptions) => {
  const { jsPDF } = await import('jspdf');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 14;
  const maxWidth = pageWidth - marginX * 2;
  const lineHeight = 6;
  let cursorY = 16;

  const ensurePageSpace = (requiredHeight: number) => {
    if (cursorY + requiredHeight <= pageHeight - 14) {
      return;
    }

    pdf.addPage();
    cursorY = 16;
  };

  const writeLine = (
    text: string,
    options?: { bold?: boolean; size?: number; color?: [number, number, number] }
  ) => {
    const size = options?.size ?? 11;
    const lines = pdf.splitTextToSize(text, maxWidth);
    ensurePageSpace(lines.length * lineHeight + 2);
    pdf.setFont('helvetica', options?.bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    if (options?.color) {
      pdf.setTextColor(...options.color);
    } else {
      pdf.setTextColor(35, 35, 35);
    }
    pdf.text(lines, marginX, cursorY);
    cursorY += lines.length * lineHeight;
  };

  const writeSectionTitle = (text: string) => {
    ensurePageSpace(12);
    pdf.setDrawColor(220, 224, 230);
    pdf.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 6;
    writeLine(text, { bold: true, size: 14, color: [22, 68, 109] });
    cursorY += 1;
  };

  const writeField = (label: string, value: string) => {
    writeLine(`${label}: ${value}`);
  };

  writeLine(labels.title, { bold: true, size: 18, color: [22, 68, 109] });
  writeLine(
    `${labels.generatedOn}: ${new Date().toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    { size: 10, color: [110, 110, 110] }
  );
  writeLine(`${labels.activeRange}: ${activeRangeLabel}`, { size: 10, color: [110, 110, 110] });
  writeLine(`${labels.rangeWindow}: ${activeRangeWindowText}`, { size: 10, color: [110, 110, 110] });
  cursorY += 3;

  writeSectionTitle(labels.sections.overview);
  writeField(labels.kpis.totalPatients, `${weightReport.activePatients}`);
  writeField(labels.kpis.attendedAppointments, `${appointmentSummary.attendedCount}`);

  writeSectionTitle(labels.sections.appointments);
  writeLine(appointmentSummaryText, { size: 11 });
  if (appointmentSummary.relevantCount > 0) {
    writeField(labels.appointments.attended, `${appointmentSummary.attendedCount}`);
    writeField(labels.appointments.cancelled, `${appointmentSummary.cancelledCount}`);
    writeLine(labels.appointments.helper, { size: 10, color: [110, 110, 110] });
  } else {
    writeLine(labels.appointments.empty, { size: 10 });
  }

  writeSectionTitle(labels.sections.weightTable);
  if (weightReport.rows.length === 0) {
    writeLine(labels.weightTable.empty, { size: 10 });
  } else {
    writeLine(labels.weightTable.summary, { size: 10, color: [110, 110, 110] });
    cursorY += 1;
    weightReport.rows.forEach((row) => {
      writeLine(`${labels.weightTable.columns.patient}: ${row.fullName}`, {
        bold: true,
        size: 11,
      });
      writeLine(
        `${labels.weightTable.columns.latestRecord}: ${
          formatDate(row.latestRecordDateInRange, locale) ?? labels.weightTable.noRecords
        }`,
        { size: 10 }
      );
      writeLine(
        `${labels.weightTable.columns.startWeight}: ${formatWeight(row.startWeightKg)} | ` +
          `${labels.weightTable.columns.currentWeight}: ${formatWeight(row.currentWeightKg)} | ` +
          `${labels.weightTable.columns.netChange}: ${formatWeightChange(row.netChangeKg)}`,
        { size: 10 }
      );
      cursorY += 1;
    });
  }

  pdf.save(fileName);
};
