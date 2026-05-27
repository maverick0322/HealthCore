import type {
  NutritionPlanViewResponse,
  NutritionistPatientProfileResponse,
  ObservationResponse,
  WeightRecord,
} from '@/features/clinical/types/clinical.types';
import type { MealLogDTO, TodayDashboardSummary } from '@/features/tracking/types/tracking.types';

interface PatientFilePdfLabels {
  title: string;
  generatedOn: string;
  sections: {
    overview: string;
    weightHistory: string;
    calorieTrend: string;
    macroBreakdown: string;
    mealTimeline: string;
    nutritionPlan: string;
    observations: string;
  };
  fields: {
    patient: string;
    age: string;
    weight: string;
    height: string;
    goal: string;
    activity: string;
    dietType: string;
    allergies: string;
    excludedFoods: string;
    latestRecord: string;
    currentWeight: string;
    periodChange: string;
    date: string;
    change: string;
    mealSlot: string;
    dishCount: string;
    dailyGoals: string;
    caloriesAverage: string;
    calorieGoal: string;
    protein: string;
    carbs: string;
    fat: string;
    selectedDate: string;
    mealType: string;
    time: string;
    foods: string;
    calories: string;
    streak: string;
    bestStreak: string;
  };
  empty: {
    weightHistory: string;
    tracking: string;
    mealTimeline: string;
    observations: string;
    nutritionPlan: string;
    none: string;
    noFoods: string;
  };
  mealSlots: Record<string, string>;
}

interface ExportNutritionistPatientFilePdfOptions {
  patient: NutritionistPatientProfileResponse;
  nutritionPlan: NutritionPlanViewResponse | null;
  observations: ObservationResponse[];
  weightHistory: WeightRecord[];
  trackingSummary?: TodayDashboardSummary | null;
  historicalMacros?: {
    caloriesHistory: number[];
    caloriesAvg: number;
    calorieGoal: number | null;
    macrosAvg: { protein: number; carbs: number; fat: number };
  } | null;
  dailyTrackingLogs?: MealLogDTO[];
  selectedTrackingDateLabel?: string | null;
  labels: PatientFilePdfLabels;
  fileName: string;
  locale: string;
  goalLabel: string;
  activityLabel: string;
  dietLabel: string;
}

const formatDate = (value: string, locale: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatDateTime = (value: string, locale: string) => {
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatWeight = (value: number | null | undefined) =>
  value == null ? '--' : `${value.toFixed(1)} kg`;

const formatHeight = (value: number) => `${(value / 100).toFixed(2)} m`;

const getAge = (birthDate: string) => {
  if (!birthDate) {
    return null;
  }

  const today = new Date();
  const parsed = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();
  const dayDiff = today.getDate() - parsed.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
};

const formatList = (values: string[] | undefined, fallback: string) =>
  values && values.length > 0 ? values.join(', ') : fallback;

export const exportNutritionistPatientFilePdf = async ({
  patient,
  nutritionPlan,
  observations,
  weightHistory,
  trackingSummary,
  historicalMacros,
  dailyTrackingLogs = [],
  selectedTrackingDateLabel,
  labels,
  fileName,
  locale,
  goalLabel,
  activityLabel,
  dietLabel,
}: ExportNutritionistPatientFilePdfOptions) => {
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

  const writeLine = (text: string, options?: { bold?: boolean; size?: number; color?: [number, number, number] }) => {
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
    writeLine(text, { bold: true, size: 14, color: [32, 95, 140] });
    cursorY += 1;
  };

  const writeField = (label: string, value: string) => {
    writeLine(`${label}: ${value}`);
  };

  writeLine(labels.title, { bold: true, size: 18, color: [22, 68, 109] });
  writeLine(`${labels.fields.patient}: ${patient.fullName ?? patient.userId}`, { size: 12 });
  writeLine(`${labels.generatedOn}: ${new Date().toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`, { size: 10, color: [110, 110, 110] });
  cursorY += 3;

  writeSectionTitle(labels.sections.overview);
  writeField(labels.fields.age, (() => {
    const age = getAge(patient.birthDate);
    return age == null ? labels.empty.none : `${age}`;
  })());
  writeField(labels.fields.weight, formatWeight(patient.weightKg));
  writeField(labels.fields.height, formatHeight(patient.heightCm));
  writeField(labels.fields.goal, goalLabel);
  writeField(labels.fields.activity, activityLabel);
  writeField(labels.fields.dietType, dietLabel);
  writeField(labels.fields.allergies, formatList(patient.allergies, labels.empty.none));
  writeField(labels.fields.excludedFoods, formatList(patient.excludedFoods, labels.empty.none));

  writeSectionTitle(labels.sections.weightHistory);
  if (weightHistory.length === 0) {
    writeLine(labels.empty.weightHistory);
  } else {
    const sortedRecords = [...weightHistory].sort((left, right) => left.date.localeCompare(right.date));
    const latestRecord = sortedRecords[sortedRecords.length - 1];
    const firstRecord = sortedRecords[0];
    const netChange = latestRecord.weightKg - firstRecord.weightKg;

    writeLine(
      `${labels.fields.latestRecord}: ${formatDate(latestRecord.date, locale)} | ` +
        `${labels.fields.currentWeight}: ${formatWeight(latestRecord.weightKg)} | ` +
        `${labels.fields.change}: ${netChange > 0 ? '+' : ''}${netChange.toFixed(1)} kg`,
      { size: 10 }
    );
    cursorY += 1;

    sortedRecords.forEach((record, index) => {
      const previous = index > 0 ? sortedRecords[index - 1] : null;
      const change = previous ? `${(record.weightKg - previous.weightKg > 0 ? '+' : '')}${(record.weightKg - previous.weightKg).toFixed(1)} kg` : '--';
      writeLine(
        `${labels.fields.date}: ${formatDate(record.date, locale)} | ${labels.fields.weight}: ${formatWeight(record.weightKg)} | ${labels.fields.change}: ${change}`,
        { size: 10 }
      );
    });
  }

  writeSectionTitle(labels.sections.calorieTrend);
  if (!historicalMacros) {
    writeLine(labels.empty.tracking);
  } else {
    writeField(labels.fields.caloriesAverage, `${historicalMacros.caloriesAvg} kcal`);
    writeField(
      labels.fields.calorieGoal,
      historicalMacros.calorieGoal == null ? labels.empty.none : `${historicalMacros.calorieGoal} kcal`
    );
    if (trackingSummary) {
      writeField(labels.fields.streak, `${trackingSummary.currentStreak}`);
      writeField(labels.fields.bestStreak, `${trackingSummary.bestStreak}`);
    }
    writeLine(historicalMacros.caloriesHistory.map((value, index) => `D${index + 1}: ${Math.round(value)} kcal`).join(' | '), {
      size: 10,
    });
  }

  writeSectionTitle(labels.sections.macroBreakdown);
  if (!historicalMacros) {
    writeLine(labels.empty.tracking);
  } else {
    writeField(labels.fields.protein, `${historicalMacros.macrosAvg.protein}%`);
    writeField(labels.fields.carbs, `${historicalMacros.macrosAvg.carbs}%`);
    writeField(labels.fields.fat, `${historicalMacros.macrosAvg.fat}%`);
  }

  writeSectionTitle(labels.sections.mealTimeline);
  writeField(labels.fields.selectedDate, selectedTrackingDateLabel ?? labels.empty.none);
  if (dailyTrackingLogs.length === 0) {
    writeLine(labels.empty.mealTimeline);
  } else {
    dailyTrackingLogs.forEach((log) => {
      const foods = log.items?.map((item) => item.foodName).filter(Boolean).join(', ');
      writeLine(`${labels.fields.mealType}: ${labels.mealSlots[log.mealType] ?? log.mealType}`, {
        bold: true,
        size: 10,
      });
      writeLine(`${labels.fields.time}: ${formatDateTime(log.consumedAt, locale)}`, { size: 10 });
      writeLine(`${labels.fields.calories}: ${Math.round(log.totalCalories)} kcal`, { size: 10 });
      writeLine(`${labels.fields.foods}: ${foods || labels.empty.noFoods}`, { size: 10 });
      cursorY += 1;
    });
  }

  writeSectionTitle(labels.sections.nutritionPlan);
  if (!nutritionPlan) {
    writeLine(labels.empty.nutritionPlan);
  } else {
    writeField(
      labels.fields.dailyGoals,
      `${nutritionPlan.dailyGoals.targetCalories} kcal - ${nutritionPlan.dailyGoals.targetProtein} g P - ${nutritionPlan.dailyGoals.targetCarbs} g C - ${nutritionPlan.dailyGoals.targetFat} g G`
    );

    nutritionPlan.sections.forEach((section) => {
      const mealLabel = labels.mealSlots[section.mealSlot] ?? section.mealSlot;
      writeLine(
        `${labels.fields.mealSlot}: ${mealLabel} | ${labels.fields.dishCount}: ${section.options.length}`,
        { bold: true, size: 11 }
      );

      if (section.options.length === 0) {
        writeLine(labels.empty.none, { size: 10 });
        return;
      }

      section.options.forEach((option) => {
        writeLine(`- ${option.name} (${option.totalCalories} kcal)`, { size: 10 });
      });
    });
  }

  writeSectionTitle(labels.sections.observations);
  if (observations.length === 0) {
    writeLine(labels.empty.observations);
  } else {
    observations.forEach((observation) => {
      writeLine(`${formatDateTime(observation.createdAt, locale)} - ${observation.note}`, { size: 10 });
    });
  }

  pdf.save(fileName);
};
