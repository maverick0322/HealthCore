import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import type { NutritionPlanViewResponse } from '@/features/clinical/types/clinical.types';
import { render, screen, waitFor } from '@/test/test-utils';

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
        onQuickTrack={vi.fn()}
      />
    );

    expect(screen.getByText('Daily goals')).toBeInTheDocument();
    expect(screen.getAllByText('Add dish').length).toBeGreaterThan(0);
    expect(screen.getByText('Log this dish today')).toBeInTheDocument();
    expect(screen.getByText('7:00 - 9:00')).toBeInTheDocument();

    await user.click(screen.getAllByText('Add dish')[0]);

    expect(screen.getByText('Save dish')).toBeInTheDocument();
  });

  it('shows validation feedback when trying to save an empty dish', async () => {
    const user = userEvent.setup();
    render(
      <NutritionPlanWorkspace
        namespace="patient"
        view={baseView}
        onSave={vi.fn().mockResolvedValue(baseView)}
        onSearchFoods={vi.fn().mockResolvedValue([])}
      />
    );

    await user.click(screen.getAllByText('Add dish')[0]);
    await user.click(screen.getByText('Save dish'));

    expect(screen.getByText('Enter a name for the dish.')).toBeInTheDocument();
    expect(
      screen.getByText('Add at least one ingredient before saving the dish.'),
    ).toBeInTheDocument();
  });

  it('shows a no-results message when the ingredient search returns no foods', async () => {
    const user = userEvent.setup();
    render(
      <NutritionPlanWorkspace
        namespace="patient"
        view={baseView}
        onSave={vi.fn().mockResolvedValue(baseView)}
        onSearchFoods={vi.fn().mockResolvedValue([])}
      />
    );

    await user.click(screen.getAllByText('Add dish')[0]);
    await user.type(screen.getByPlaceholderText('Search a food from the catalog...'), 'Chicken');

    await waitFor(() => {
      expect(
        screen.getByText('We could not find ingredients for "Chicken". Try another term or try again later.'),
      ).toBeInTheDocument();
    });
  });

  it('shows a service-unavailable message when the ingredient search fails', async () => {
    const user = userEvent.setup();
    render(
      <NutritionPlanWorkspace
        namespace="patient"
        view={baseView}
        onSave={vi.fn().mockResolvedValue(baseView)}
        onSearchFoods={vi.fn().mockRejectedValue(new Error('catalog down'))}
      />
    );

    await user.click(screen.getAllByText('Add dish')[0]);
    await user.type(screen.getByPlaceholderText('Search a food from the catalog...'), 'Chicken');

    await waitFor(() => {
      expect(
        screen.getByText('The ingredient search service is not available right now. Please try again later.'),
      ).toBeInTheDocument();
    });
  });

  it('renders read-only linked patient mode with the tracking placeholder button', () => {
    render(
      <NutritionPlanWorkspace
        namespace="patient"
        view={{ ...baseView, mode: 'READ_ONLY', canEdit: false, authorType: 'NUTRITIONIST' }}
        onQuickTrack={vi.fn()}
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

  it('renders an unavailable state when there is no plan view and it is not loading', () => {
    render(<NutritionPlanWorkspace namespace="patient" view={null} />);

    expect(screen.getByText('The nutrition plan is not available right now.')).toBeInTheDocument();
  });

  it('renders patient observations below the daily goals', () => {
    render(
      <NutritionPlanWorkspace
        namespace="patient"
        view={baseView}
        observations={[
          {
            id: 'obs-1',
            patientId: 'patient-1',
            nutritionistId: 'nutri-1',
            note: 'Increase hydration during the afternoon.',
            createdAt: '2026-05-18T12:00:00Z',
          },
        ]}
      />
    );

    expect(screen.getByText('Nutritionist observations')).toBeInTheDocument();
    expect(screen.getByText('Increase hydration during the afternoon.')).toBeInTheDocument();
  });
});
