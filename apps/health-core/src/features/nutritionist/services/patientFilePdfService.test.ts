import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
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
        profilePhotoUrl: null,
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
          note: 'Mantener hidratacion',
          createdAt: '2026-05-18T12:00:00Z',
        },
      ],
      weightHistory: [
        { weightKg: 65, date: '2026-05-01' },
        { weightKg: 64, date: '2026-05-18' },
      ],
      trackingSummary: {
        totalCalories: 1800,
        totalProteins: 120,
        totalCarbs: 150,
        totalFats: 50,
        totalWaterMl: 1500,
        currentStreak: 2,
        bestStreak: 5,
      },
      historicalMacros: {
        caloriesHistory: [1800, 1700, 1750, 1600, 1680, 1720, 1690],
        caloriesAvg: 1706,
        calorieGoal: 2000,
        macrosAvg: { protein: 30, carbs: 45, fat: 25 },
      },
      dailyTrackingLogs: [
        {
          id: 'log-1',
          userId: 'patient-1',
          mealName: 'Desayuno de prueba',
          mealType: 'BREAKFAST',
          consumedAt: '2026-05-18T08:00:00Z',
          photoKey: null,
          items: [{
            barcode: '123',
            foodName: 'Avena',
            consumedGrams: 60,
            calories: 320,
            proteins: 12,
            carbohydrates: 45,
            fats: 6,
            fiberGrams: 4,
            sodiumMg: 12,
            sugarGrams: 2,
            potassiumMg: 120,
          }],
          totalCalories: 320,
          totalProteins: 12,
          totalCarbs: 45,
          totalFats: 6,
        },
      ],
      selectedTrackingDateLabel: '2026-05-18',
      labels: {
        title: 'Expediente clinico del paciente',
        generatedOn: 'Generado el',
        sections: {
          overview: 'Resumen General',
          weightHistory: 'Historial',
          calorieTrend: 'Tendencia calorica',
          macroBreakdown: 'Macros',
          mealTimeline: 'Registro diario',
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
          latestRecord: 'Ultimo registro',
          currentWeight: 'Peso actual',
          periodChange: 'Cambio',
          date: 'Fecha',
          change: 'Variacion',
          mealSlot: 'Tiempo de comida',
          dishCount: 'Platillos',
          dailyGoals: 'Metas diarias',
          caloriesAverage: 'Promedio',
          calorieGoal: 'Meta',
          protein: 'Proteina',
          carbs: 'Carbs',
          fat: 'Grasas',
          selectedDate: 'Fecha seleccionada',
          mealType: 'Tiempo de comida',
          time: 'Hora',
          foods: 'Alimentos',
          calories: 'Calorias',
          streak: 'Racha',
          bestStreak: 'Mejor racha',
        },
        empty: {
          weightHistory: 'Sin peso',
          tracking: 'Sin tracking',
          mealTimeline: 'Sin registro diario',
          observations: 'Sin observaciones',
          nutritionPlan: 'Sin plan',
          none: 'Sin informacion',
          noFoods: 'Sin alimentos',
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
  });
});
