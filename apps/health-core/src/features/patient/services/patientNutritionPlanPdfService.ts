import type {
  NutritionPlanViewResponse,
  ObservationResponse,
} from '@/features/clinical/types/clinical.types';

interface PatientNutritionPlanPdfLabels {
  title: string;
  generatedOn: string;
  patient: string;
  sections: {
    dailyGoals: string;
    currentPlan: string;
    previousPlan: string;
    observations: string;
  };
  fields: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    hydration: string;
    mealSlot: string;
    dish: string;
    ingredients: string;
    instructions: string;
    notes: string;
    updatedAt: string;
  };
  empty: {
    plan: string;
    observations: string;
    previousPlan: string;
    none: string;
    noInstructions: string;
    noNotes: string;
  };
  mealSlots: Record<string, string>;
  units: Record<string, string>;
}

interface ExportPatientNutritionPlanPdfOptions {
  fileName: string;
  locale: string;
  patientName?: string | null;
  view: NutritionPlanViewResponse | null;
  observations: ObservationResponse[];
  labels: PatientNutritionPlanPdfLabels;
}

const formatDateTime = (value: string, locale: string) =>
  new Date(value).toLocaleString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const exportPatientNutritionPlanPdf = async ({
  fileName,
  locale,
  patientName,
  view,
  observations,
  labels,
}: ExportPatientNutritionPlanPdfOptions) => {
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
  if (patientName?.trim()) {
    writeLine(`${labels.patient}: ${patientName.trim()}`, { size: 12 });
  }
  writeLine(
    `${labels.generatedOn}: ${new Date().toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    { size: 10, color: [110, 110, 110] }
  );
  cursorY += 3;

  if (!view) {
    writeSectionTitle(labels.sections.currentPlan);
    writeLine(labels.empty.plan);
    pdf.save(fileName);
    return;
  }

  writeSectionTitle(labels.sections.dailyGoals);
  writeField(labels.fields.calories, `${view.dailyGoals.targetCalories} kcal`);
  writeField(labels.fields.protein, `${view.dailyGoals.targetProtein} g`);
  writeField(labels.fields.carbs, `${view.dailyGoals.targetCarbs} g`);
  writeField(labels.fields.fat, `${view.dailyGoals.targetFat} g`);
  writeField(labels.fields.hydration, `${view.dailyGoals.targetWaterGlasses}`);

  const writePlanSections = (
    title: string,
    sections: NutritionPlanViewResponse['sections'],
    updatedAt?: string | null,
    emptyMessage?: string
  ) => {
    writeSectionTitle(title);

    if (updatedAt) {
      writeField(labels.fields.updatedAt, formatDateTime(updatedAt, locale));
    }

    if (sections.length === 0) {
      writeLine(emptyMessage ?? labels.empty.plan);
      return;
    }

    sections.forEach((section) => {
      const mealLabel = labels.mealSlots[section.mealSlot] ?? section.mealSlot;
      writeLine(`${labels.fields.mealSlot}: ${mealLabel}`, {
        bold: true,
        size: 11,
      });

      if (section.options.length === 0) {
        writeLine(labels.empty.none, { size: 10 });
        cursorY += 1;
        return;
      }

      section.options.forEach((option) => {
        writeLine(`${labels.fields.dish}: ${option.name}`, {
          bold: true,
          size: 10,
        });
        writeLine(
          `${labels.fields.calories}: ${option.totalCalories} kcal | ` +
            `${labels.fields.protein}: ${option.totalProtein} g | ` +
            `${labels.fields.carbs}: ${option.totalCarbs} g | ` +
            `${labels.fields.fat}: ${option.totalFat} g`,
          { size: 10 }
        );

        if (option.ingredients.length > 0) {
          writeLine(`${labels.fields.ingredients}:`, { bold: true, size: 10 });
          option.ingredients.forEach((ingredient) => {
            const unitLabel = labels.units[ingredient.unit] ?? ingredient.unit;
            writeLine(
              `- ${ingredient.name}: ${ingredient.quantityAmount} ${unitLabel}`,
              { size: 10 }
            );
          });
        } else {
          writeLine(`${labels.fields.ingredients}: ${labels.empty.none}`, { size: 10 });
        }

        writeLine(
          `${labels.fields.instructions}: ${
            option.instructions?.trim() ? option.instructions : labels.empty.noInstructions
          }`,
          { size: 10 }
        );
        writeLine(
          `${labels.fields.notes}: ${option.notes?.trim() ? option.notes : labels.empty.noNotes}`,
          { size: 10 }
        );
        cursorY += 1;
      });
    });
  };

  writePlanSections(labels.sections.currentPlan, view.sections);

  if (view.contextSelfManagedPlan) {
    writePlanSections(
      labels.sections.previousPlan,
      view.contextSelfManagedPlan.sections,
      view.contextSelfManagedPlan.updatedAt,
      labels.empty.previousPlan
    );
  }

  writeSectionTitle(labels.sections.observations);
  if (observations.length === 0) {
    writeLine(labels.empty.observations);
  } else {
    observations.forEach((observation) => {
      writeLine(`${formatDateTime(observation.createdAt, locale)} - ${observation.note}`, {
        size: 10,
      });
    });
  }

  pdf.save(fileName);
};
