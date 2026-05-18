import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import type { NutritionPlanViewResponse } from '@/features/clinical/types/clinical.types';
import { render, screen } from '@/test/test-utils';

import { NutritionPlanWorkspace } from './NutritionPlanWorkspace';

const baseView: NutritionPlanViewResponse = {
  mode: 'SELF_MANAGED',
  authorType: 'SELF_MANAGED',
  canEdit: true,
  dailyGoals: {
    targetCalories: 2000,
    targetProtein: 120,
    targetCarbs: 200,
    targetFat: 60,
    targetWaterGlasses: 10,
  },
  sections: [
    {
      mealSlot: 'BREAKFAST',
      options: [
        {
          id: 'meal-1',
          name: 'Protein Oats',
          instructions: 'Cook oats.',
          notes: 'Swap berries with apple.',
          ingredients: [
            {
              barcode: 'food-1',
              name: 'Oats',
              brand: 'Brand',
              imageUrl: '',
              unit: 'GRAMS',
              quantityAmount: 100,
              calories: 300,
              proteinGrams: 15,
              carbsGrams: 40,
              fatGrams: 10,
            },
          ],
          totalCalories: 300,
          totalProtein: 15,
          totalCarbs: 40,
          totalFat: 10,
        },
      ],
    },
    { mealSlot: 'LUNCH', options: [] },
    { mealSlot: 'DINNER', options: [] },
    { mealSlot: 'SNACK', options: [] },
  ],
  contextSelfManagedPlan: null,
};

describe('NutritionPlanWorkspace', () => {
  it('renders editable self-managed mode for the patient', async () => {
    const user = userEvent.setup();
    render(
      <NutritionPlanWorkspace
        namespace="patient"
        view={baseView}
        onSave={vi.fn().mockResolvedValue(baseView)}
        onSearchFoods={vi.fn().mockResolvedValue([])}
      />
    );

    expect(screen.getByText('Daily goals')).toBeInTheDocument();
    expect(screen.getAllByText('Add dish').length).toBeGreaterThan(0);

    await user.click(screen.getAllByText('Add dish')[0]);

    expect(screen.getByText('Save dish')).toBeInTheDocument();
  });

  it('renders read-only linked patient mode with the tracking placeholder button', () => {
    render(
      <NutritionPlanWorkspace
        namespace="patient"
        view={{ ...baseView, mode: 'READ_ONLY', canEdit: false, authorType: 'NUTRITIONIST' }}
      />
    );

    expect(screen.getByText('Log this dish today')).toBeInTheDocument();
    expect(screen.queryByText('Save plan')).not.toBeInTheDocument();
  });

  it('renders the nutritionist context plan when available', () => {
    render(
      <NutritionPlanWorkspace
        namespace="nutritionist"
        view={{
          ...baseView,
          mode: 'NUTRITIONIST',
          authorType: 'NUTRITIONIST',
          contextSelfManagedPlan: {
            authorType: 'SELF_MANAGED',
            dailyGoals: baseView.dailyGoals,
            sections: baseView.sections,
            updatedAt: '2026-05-17T00:00:00Z',
          },
        }}
      />
    );

    expect(screen.getByText('Previous self-managed plan')).toBeInTheDocument();
    expect(screen.getAllByText('Protein Oats').length).toBeGreaterThan(0);
  });
});
