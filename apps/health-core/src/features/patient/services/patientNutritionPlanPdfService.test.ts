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

import { exportPatientNutritionPlanPdf } from './patientNutritionPlanPdfService';

describe('patientNutritionPlanPdfService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a structured pdf from the patient plan and saves the file', async () => {
    await exportPatientNutritionPlanPdf({
      fileName: 'patient-plan.pdf',
      locale: 'es-MX',
      patientName: 'Ana Lopez',
      view: {
        mode: 'NUTRITIONIST',
        authorType: 'NUTRITIONIST',
        canEdit: false,
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
                name: 'Avena proteica',
                instructions: 'Mezclar y cocinar',
                notes: 'Puedes cambiar la fruta',
                ingredients: [
                  {
                    barcode: '1',
                    name: 'Avena',
                    brand: 'Marca',
                    imageUrl: '',
                    unit: 'GRAMS',
                    quantityAmount: 80,
                    calories: 300,
                    proteinGrams: 10,
                    carbsGrams: 50,
                    fatGrams: 5,
                  },
                ],
                totalCalories: 420,
                totalProtein: 22,
                totalCarbs: 60,
                totalFat: 8,
              },
            ],
          },
        ],
        contextSelfManagedPlan: {
          authorType: 'SELF_MANAGED',
          dailyGoals: {
            targetCalories: 1900,
            targetProtein: 110,
            targetCarbs: 210,
            targetFat: 60,
            targetWaterGlasses: 9,
          },
          sections: [],
          updatedAt: '2026-05-20T10:30:00Z',
        },
      },
      observations: [
        {
          id: 'obs-1',
          patientId: 'patient-1',
          nutritionistId: 'nutri-1',
          note: 'Mantener buena hidratación',
          createdAt: '2026-05-24T12:30:00Z',
        },
      ],
      labels: {
        title: 'Plan nutricional',
        generatedOn: 'Generado el',
        patient: 'Paciente',
        sections: {
          dailyGoals: 'Metas diarias',
          currentPlan: 'Plan actual',
          previousPlan: 'Plan autogestionado previo',
          observations: 'Observaciones',
        },
        fields: {
          calories: 'Calorías',
          protein: 'Proteína',
          carbs: 'Carbohidratos',
          fat: 'Grasas',
          hydration: 'Hidratación',
          mealSlot: 'Tiempo de comida',
          dish: 'Platillo',
          ingredients: 'Ingredientes',
          instructions: 'Instrucciones',
          notes: 'Notas',
          updatedAt: 'Última actualización',
        },
        empty: {
          plan: 'No hay un plan nutricional disponible en este momento',
          observations: 'Aún no hay observaciones disponibles',
          previousPlan: 'No hay un plan autogestionado previo disponible',
          none: 'Sin registros',
          noInstructions: 'Sin instrucciones registradas',
          noNotes: 'Sin notas registradas',
        },
        mealSlots: {
          BREAKFAST: 'Desayuno',
          LUNCH: 'Comida',
          DINNER: 'Cena',
          SNACK: 'Snack',
        },
        units: {
          GRAMS: 'Gramos',
          MILLILITERS: 'Mililitros',
        },
      },
    });

    expect(mockJsPdf).toHaveBeenCalledTimes(1);
    expect(mockText).toHaveBeenCalled();
    expect(mockLine).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalledWith('patient-plan.pdf');
    expect(mockAddPage).not.toHaveBeenCalled();
    expect(mockSplitTextToSize).toHaveBeenCalledWith(
      'Plan nutricional',
      expect.any(Number)
    );
    expect(mockSplitTextToSize).toHaveBeenCalledWith(
      'Paciente: Ana Lopez',
      expect.any(Number)
    );
  });

  it('exports a valid pdf when there is no plan available', async () => {
    await exportPatientNutritionPlanPdf({
      fileName: 'empty-plan.pdf',
      locale: 'en-US',
      patientName: null,
      view: null,
      observations: [],
      labels: {
        title: 'Nutrition plan',
        generatedOn: 'Generated on',
        patient: 'Patient',
        sections: {
          dailyGoals: 'Daily goals',
          currentPlan: 'Current plan',
          previousPlan: 'Previous self-managed plan',
          observations: 'Observations',
        },
        fields: {
          calories: 'Calories',
          protein: 'Protein',
          carbs: 'Carbohydrates',
          fat: 'Fat',
          hydration: 'Hydration',
          mealSlot: 'Meal slot',
          dish: 'Dish',
          ingredients: 'Ingredients',
          instructions: 'Instructions',
          notes: 'Notes',
          updatedAt: 'Last updated',
        },
        empty: {
          plan: 'There is no nutrition plan available right now',
          observations: 'There are no observations available yet',
          previousPlan: 'There is no previous self-managed plan available',
          none: 'No records',
          noInstructions: 'No instructions provided',
          noNotes: 'No notes provided',
        },
        mealSlots: {
          BREAKFAST: 'Breakfast',
          LUNCH: 'Lunch',
          DINNER: 'Dinner',
          SNACK: 'Snack',
        },
        units: {
          GRAMS: 'Grams',
          MILLILITERS: 'Milliliters',
        },
      },
    });

    expect(mockSave).toHaveBeenCalledWith('empty-plan.pdf');
    expect(mockSetFont).toHaveBeenCalled();
    expect(mockSetFontSize).toHaveBeenCalled();
    expect(mockSetTextColor).toHaveBeenCalled();
    expect(mockSetDrawColor).toHaveBeenCalled();
  });
});
