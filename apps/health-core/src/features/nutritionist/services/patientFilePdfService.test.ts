import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockAddPage,
  mockSave,
  mockText,
  mockLine,
  mockSetDrawColor,
  mockSplitTextToSize,
  mockJsPdf,
} = vi.hoisted(() => {
  const addPage = vi.fn();
  const save = vi.fn();
  const text = vi.fn();
  const line = vi.fn();
  const setDrawColor = vi.fn();
  const setFont = vi.fn();
  const setFontSize = vi.fn();
  const setTextColor = vi.fn();
  const splitTextToSize = vi.fn((value: string) => [value]);
  const jsPdf = vi.fn(function MockJsPdf() {
    return {
      internal: {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      },
      addPage,
      save,
      text,
      line,
      setDrawColor,
      setFont,
      setFontSize,
      setTextColor,
      splitTextToSize,
    };
  });

  return {
    mockAddPage: addPage,
    mockSave: save,
    mockText: text,
    mockLine: line,
    mockSetDrawColor: setDrawColor,
    mockSetFont: setFont,
    mockSetFontSize: setFontSize,
    mockSetTextColor: setTextColor,
    mockSplitTextToSize: splitTextToSize,
    mockJsPdf: jsPdf,
  };
});

vi.mock('jspdf', () => ({
  jsPDF: mockJsPdf,
}));

import { exportNutritionistPatientFilePdf } from './patientFilePdfService';

describe('patientFilePdfService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds and saves a structured patient file pdf', async () => {
    await exportNutritionistPatientFilePdf({
      patient: {
        userId: 'patient-1',
        firstName: 'Ana',
        paternalLastName: 'Lopez',
        maternalLastName: 'Ruiz',
        fullName: 'Ana Lopez Ruiz',
        weightKg: 64,
        heightCm: 168,
        birthDate: '1996-05-13',
        gender: 'FEMALE',
        activityLevel: 'LIGHTLY_ACTIVE',
        goal: 'health',
        dietType: 'vegetarian',
        allergies: [],
        excludedFoods: ['cebolla'],
        nutritionistId: 'nutri-1',
        profileCompleted: true,
      },
      nutritionPlan: {
        mode: 'NUTRITIONIST',
        authorType: 'NUTRITIONIST',
        canEdit: true,
        dailyGoals: {
          targetCalories: 2000,
          targetProtein: 120,
          targetCarbs: 220,
          targetFat: 65,
          targetWaterGlasses: 10,
        },
        sections: [
          {
            mealSlot: 'BREAKFAST',
            options: [
              {
                id: 'dish-1',
                name: 'Avena',
                instructions: '',
                notes: '',
                ingredients: [],
                totalCalories: 350,
                totalProtein: 12,
                totalCarbs: 40,
                totalFat: 8,
              },
            ],
          },
        ],
        contextSelfManagedPlan: null,
      },
      observations: [
        {
          id: 'obs-1',
          patientId: 'patient-1',
          nutritionistId: 'nutri-1',
          note: 'Mantener hidratación',
          createdAt: '2026-05-18T12:00:00Z',
        },
      ],
      weightHistory: [
        { weightKg: 65, date: '2026-05-01' },
        { weightKg: 64, date: '2026-05-18' },
      ],
      labels: {
        title: 'Expediente clínico del paciente',
        generatedOn: 'Generado el',
        sections: {
          overview: 'Resumen General',
          weightHistory: 'Historial',
          nutritionPlan: 'Plan Nutricional',
          observations: 'Observaciones',
        },
        fields: {
          patient: 'Paciente',
          age: 'Edad',
          weight: 'Peso',
          height: 'Altura',
          goal: 'Objetivo',
          activity: 'Actividad',
          dietType: 'Tipo de dieta',
          allergies: 'Alergias',
          excludedFoods: 'Alimentos a evitar',
          latestRecord: 'Último registro',
          date: 'Fecha',
          change: 'Variación',
          mealSlot: 'Tiempo de comida',
          dishCount: 'Platillos',
          dailyGoals: 'Metas diarias',
        },
        empty: {
          weightHistory: 'Sin peso',
          observations: 'Sin observaciones',
          nutritionPlan: 'Sin plan',
          none: 'Sin información',
        },
        mealSlots: {
          BREAKFAST: 'Desayuno',
        },
      },
      fileName: 'expediente.pdf',
      locale: 'es-MX',
      goalLabel: 'Mejorar salud',
      activityLabel: 'Ligero',
      dietLabel: 'Vegetariana',
    });

    expect(mockJsPdf).toHaveBeenCalledTimes(1);
    expect(mockText).toHaveBeenCalled();
    expect(mockLine).toHaveBeenCalled();
    expect(mockSetDrawColor).toHaveBeenCalled();
    expect(mockSplitTextToSize).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalledWith('expediente.pdf');
    expect(mockAddPage).not.toHaveBeenCalled();
  });
});
