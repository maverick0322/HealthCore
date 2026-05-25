import { beforeEach, describe, expect, it, vi } from "vitest";

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
    mockSplitTextToSize: splitTextToSize,
    mockJsPdf: jsPdf,
  };
});

vi.mock("jspdf", () => ({
  jsPDF: mockJsPdf,
}));

import { exportPatientHistoryPdf } from "./patientHistoryPdfService";

describe("patientHistoryPdfService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds and saves a structured patient history pdf", async () => {
    await exportPatientHistoryPdf({
      fileName: "historial.pdf",
      locale: "es-MX",
      title: "Historial Nutricional",
      generatedOnLabel: "Generado el",
      sections: {
        weightHistory: "Peso",
        calorieTrend: "Calorías",
        macroBreakdown: "Macros",
        mealTimeline: "Registro",
      },
      fields: {
        currentWeight: "Peso actual",
        periodChange: "Cambio",
        latestRecord: "Último registro",
        caloriesAverage: "Promedio",
        calorieGoal: "Meta",
        protein: "Proteína",
        carbs: "Carbs",
        fat: "Grasas",
        selectedDate: "Fecha",
        date: "Fecha",
        weight: "Peso",
        variation: "Variación",
        mealType: "Tiempo de comida",
        time: "Hora",
        foods: "Alimentos",
        calories: "Calorías",
      },
      empty: {
        weightHistory: "Sin pesos",
        tracking: "Sin tracking",
        mealTimeline: "Sin logs",
        noFoods: "Sin alimentos",
      },
      selectedDateLabel: "Hoy",
      weightHistory: [
        { weightKg: 82, date: "2026-05-01" },
        { weightKg: 80.5, date: "2026-05-18" },
      ],
      caloriesHistory: [1800, 1750, 1900, 1600, 1700, 1820, 1760],
      caloriesAvg: 1761,
      calorieGoal: 2000,
      macrosAvg: { protein: 30, carbs: 45, fat: 25 },
      logs: [
        {
          id: "log-1",
          mealType: "BREAKFAST",
          consumedAt: "2026-05-18T08:00:00Z",
          items: [{ foodName: "Avena" }, { foodName: "Plátano" }],
          totalCalories: 420,
        },
      ],
    });

    expect(mockJsPdf).toHaveBeenCalledTimes(1);
    expect(mockText).toHaveBeenCalled();
    expect(mockLine).toHaveBeenCalled();
    expect(mockSetDrawColor).toHaveBeenCalled();
    expect(mockSplitTextToSize).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalledWith("historial.pdf");
    expect(mockAddPage).not.toHaveBeenCalled();
  });
});
