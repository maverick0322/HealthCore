import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockAddPage,
  mockLine,
  mockSave,
  mockSetDrawColor,
  mockSetFont,
  mockSetFontSize,
  mockSetTextColor,
  mockSplitTextToSize,
  mockText,
  mockJsPdf,
} = vi.hoisted(() => {
  const addPage = vi.fn();
  const line = vi.fn();
  const save = vi.fn();
  const setDrawColor = vi.fn();
  const setFont = vi.fn();
  const setFontSize = vi.fn();
  const setTextColor = vi.fn();
  const splitTextToSize = vi.fn((text: string) => [text]);
  const text = vi.fn();
  const jsPdf = vi.fn(function MockJsPdf() {
    return {
      internal: {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      },
      addPage,
      line,
      save,
      setDrawColor,
      setFont,
      setFontSize,
      setTextColor,
      splitTextToSize,
      text,
    };
  });

  return {
    mockAddPage: addPage,
    mockLine: line,
    mockSave: save,
    mockSetDrawColor: setDrawColor,
    mockSetFont: setFont,
    mockSetFontSize: setFontSize,
    mockSetTextColor: setTextColor,
    mockSplitTextToSize: splitTextToSize,
    mockText: text,
    mockJsPdf: jsPdf,
  };
});

vi.mock('jspdf', () => ({
  jsPDF: mockJsPdf,
}));

import { exportNutritionistReportPdf } from './reportPdfService';

describe('reportPdfService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a structured pdf and saves the file', async () => {
    await exportNutritionistReportPdf({
      fileName: 'report.pdf',
      locale: 'es-MX',
      activeRangeLabel: '3 meses',
      activeRangeWindowText: 'Mostrando datos del 1 de marzo de 2026 al 24 de mayo de 2026',
      appointmentSummaryText: 'En este periodo atendiste 2 consultas y se cancelo 1',
      appointmentSummary: {
        attendedCount: 2,
        cancelledCount: 1,
        relevantCount: 3,
        attendedPercent: 67,
        cancelledPercent: 33,
      },
      weightReport: {
        activePatients: 2,
        patientsWithoutWeightInRange: 0,
        rows: [
          {
            patientId: 'patient-1',
            fullName: 'Ana Lopez',
            latestRecordDateInRange: '2026-05-21',
            startWeightKg: 74,
            currentWeightKg: 70.5,
            netChangeKg: -3.5,
            hasRecordsInRange: true,
          },
        ],
      },
      labels: {
        title: 'Reportes y gestion operativa',
        generatedOn: 'Generado el',
        activeRange: 'Periodo activo',
        rangeWindow: 'Ventana del periodo',
        sections: {
          overview: 'Resumen ejecutivo',
          appointments: 'Resumen de citas',
          weightTable: 'Control de peso de pacientes',
        },
        kpis: {
          totalPatients: 'Pacientes Totales',
          attendedAppointments: 'Consultas atendidas',
        },
        appointments: {
          attended: 'Atendidas',
          cancelled: 'Canceladas',
          empty: 'No hubo citas atendidas ni canceladas en este periodo',
          helper:
            'Los porcentajes se calculan solo con las citas atendidas y canceladas dentro del periodo seleccionado',
        },
        weightTable: {
          noRecords: 'Sin registros en este periodo',
          empty: 'No hay pacientes vinculados para mostrar en este reporte',
          summary:
            'El primer peso y el cambio se calculan comparando el primer y el ultimo registro dentro del periodo seleccionado',
          columns: {
            patient: 'Paciente',
            latestRecord: 'Fecha del ultimo registro',
            startWeight: 'Primer peso del periodo',
            currentWeight: 'Ultimo peso del periodo',
            netChange: 'Cambio en el periodo',
          },
        },
      },
    });

    expect(mockJsPdf).toHaveBeenCalledTimes(1);
    expect(mockText).toHaveBeenCalled();
    expect(mockLine).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalledWith('report.pdf');
    expect(mockAddPage).not.toHaveBeenCalled();
    expect(mockSplitTextToSize).toHaveBeenCalledWith(
      'Reportes y gestion operativa',
      expect.any(Number)
    );
    expect(mockSplitTextToSize).toHaveBeenCalledWith(
      'Ventana del periodo: Mostrando datos del 1 de marzo de 2026 al 24 de mayo de 2026',
      expect.any(Number)
    );
  });

  it('exports a valid pdf when there is no relevant appointment activity', async () => {
    await exportNutritionistReportPdf({
      fileName: 'empty-report.pdf',
      locale: 'en-US',
      activeRangeLabel: '1 month',
      activeRangeWindowText: 'Showing data from May 1, 2026 to May 24, 2026',
      appointmentSummaryText: 'There is no attended or cancelled appointment activity in this period yet.',
      appointmentSummary: {
        attendedCount: 0,
        cancelledCount: 0,
        relevantCount: 0,
        attendedPercent: 0,
        cancelledPercent: 0,
      },
      weightReport: {
        activePatients: 0,
        patientsWithoutWeightInRange: 0,
        rows: [],
      },
      labels: {
        title: 'Reports and Operational Management',
        generatedOn: 'Generated on',
        activeRange: 'Active range',
        rangeWindow: 'Range window',
        sections: {
          overview: 'Executive summary',
          appointments: 'Appointment overview',
          weightTable: 'Patient weight control',
        },
        kpis: {
          totalPatients: 'Total Patients',
          attendedAppointments: 'Attended appointments',
        },
        appointments: {
          attended: 'Attended',
          cancelled: 'Cancelled',
          empty: 'There were no attended or cancelled appointments in this period',
          helper:
            'Percentages are calculated only from attended and cancelled appointments in the selected period',
        },
        weightTable: {
          noRecords: 'No records in this period',
          empty: 'There are no linked patients to display in this report.',
          summary:
            'The first weight and the change are calculated by comparing the first and last record within the selected period',
          columns: {
            patient: 'Patient',
            latestRecord: 'Date of latest record',
            startWeight: 'First weight in period',
            currentWeight: 'Latest weight in period',
            netChange: 'Change in period',
          },
        },
      },
    });

    expect(mockSave).toHaveBeenCalledWith('empty-report.pdf');
    expect(mockSetFont).toHaveBeenCalled();
    expect(mockSetFontSize).toHaveBeenCalled();
    expect(mockSetTextColor).toHaveBeenCalled();
    expect(mockSetDrawColor).toHaveBeenCalled();
  });
});
