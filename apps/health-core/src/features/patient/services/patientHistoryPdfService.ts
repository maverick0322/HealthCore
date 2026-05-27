import type { WeightRecord } from "@/features/clinical/types/clinical.types";

interface PatientHistoryPdfLabels {
  title: string;
  generatedOnLabel: string;
  sections: {
    weightHistory: string;
    calorieTrend: string;
    macroBreakdown: string;
    mealTimeline: string;
  };
  fields: {
    currentWeight: string;
    periodChange: string;
    latestRecord: string;
    caloriesAverage: string;
    calorieGoal: string;
    protein: string;
    carbs: string;
    fat: string;
    selectedDate: string;
    date: string;
    weight: string;
    variation: string;
    mealType: string;
    time: string;
    foods: string;
    calories: string;
  };
  empty: {
    weightHistory: string;
    tracking: string;
    mealTimeline: string;
    noFoods: string;
  };
  mealTypeLabels: Record<string, string>;
}

interface PatientHistoryMealLog {
  id: string;
  mealType: string;
  consumedAt: string;
  items?: Array<{ foodName?: string }>;
  totalCalories?: number;
}

interface ExportPatientHistoryPdfOptions {
  fileName: string;
  locale: string;
  title: string;
  generatedOnLabel: string;
  sections: PatientHistoryPdfLabels["sections"];
  fields: PatientHistoryPdfLabels["fields"];
  empty: PatientHistoryPdfLabels["empty"];
  mealTypeLabels: PatientHistoryPdfLabels["mealTypeLabels"];
  selectedDateLabel: string;
  weightHistory: WeightRecord[];
  caloriesHistory: number[];
  caloriesAvg: number;
  calorieGoal: number | null;
  macrosAvg: { protein: number; carbs: number; fat: number };
  logs: PatientHistoryMealLog[];
}

const formatDate = (value: string, locale: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatDateTime = (value: string, locale: string) => {
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatWeight = (value: number | null | undefined) =>
  value == null ? "--" : `${value.toFixed(1)} kg`;

const formatVariation = (value: number | null | undefined) => {
  if (value == null) {
    return "--";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} kg`;
};

export const exportPatientHistoryPdf = async ({
  fileName,
  locale,
  title,
  generatedOnLabel,
  sections,
  fields,
  empty,
  mealTypeLabels,
  selectedDateLabel,
  weightHistory,
  caloriesHistory,
  caloriesAvg,
  calorieGoal,
  macrosAvg,
  logs,
}: ExportPatientHistoryPdfOptions) => {
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF("p", "mm", "a4");
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
    pdf.setFont("helvetica", options?.bold ? "bold" : "normal");
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

  const sortedWeightHistory = [...weightHistory].sort((left, right) => left.date.localeCompare(right.date));
  const firstRecord = sortedWeightHistory[0] ?? null;
  const latestRecord = sortedWeightHistory[sortedWeightHistory.length - 1] ?? null;
  const periodChange =
    firstRecord && latestRecord ? latestRecord.weightKg - firstRecord.weightKg : null;

  writeLine(title, { bold: true, size: 18, color: [22, 68, 109] });
  writeLine(
    `${generatedOnLabel}: ${new Date().toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    { size: 10, color: [110, 110, 110] }
  );
  cursorY += 3;

  writeSectionTitle(sections.weightHistory);
  if (sortedWeightHistory.length === 0) {
    writeLine(empty.weightHistory);
  } else {
    writeLine(`${fields.currentWeight}: ${formatWeight(latestRecord?.weightKg)}`);
    writeLine(`${fields.periodChange}: ${formatVariation(periodChange)}`);
    writeLine(
      `${fields.latestRecord}: ${
        latestRecord ? formatDate(latestRecord.date, locale) : "--"
      }`
    );
    cursorY += 1;

    sortedWeightHistory.forEach((record, index) => {
      const previous = index > 0 ? sortedWeightHistory[index - 1] : null;
      const variation = previous ? record.weightKg - previous.weightKg : null;
      writeLine(
        `${fields.date}: ${formatDate(record.date, locale)} | ${fields.weight}: ${formatWeight(record.weightKg)} | ${fields.variation}: ${formatVariation(variation)}`,
        { size: 10 }
      );
    });
  }

  writeSectionTitle(sections.calorieTrend);
  if (caloriesHistory.length === 0) {
    writeLine(empty.tracking);
  } else {
    writeLine(`${fields.caloriesAverage}: ${caloriesAvg} kcal`);
    writeLine(
      `${fields.calorieGoal}: ${calorieGoal == null ? "--" : `${calorieGoal} kcal`}`
    );
    writeLine(caloriesHistory.map((value, index) => `D${index + 1}: ${Math.round(value)} kcal`).join(" | "), {
      size: 10,
    });
  }

  writeSectionTitle(sections.macroBreakdown);
  writeLine(`${fields.protein}: ${macrosAvg.protein}%`);
  writeLine(`${fields.carbs}: ${macrosAvg.carbs}%`);
  writeLine(`${fields.fat}: ${macrosAvg.fat}%`);

  writeSectionTitle(sections.mealTimeline);
  writeLine(`${fields.selectedDate}: ${selectedDateLabel}`, { size: 10 });
  if (logs.length === 0) {
    writeLine(empty.mealTimeline);
  } else {
    logs.forEach((log) => {
      const foods = log.items?.map((item) => item.foodName).filter(Boolean).join(", ");
      writeLine(`${fields.mealType}: ${mealTypeLabels[log.mealType] ?? log.mealType}`, {
        bold: true,
        size: 10,
      });
      writeLine(`${fields.time}: ${formatDateTime(log.consumedAt, locale)}`, { size: 10 });
      writeLine(`${fields.calories}: ${Math.round(log.totalCalories ?? 0)} kcal`, { size: 10 });
      writeLine(`${fields.foods}: ${foods || empty.noFoods}`, { size: 10 });
      cursorY += 1;
    });
  }

  pdf.save(fileName);
};
