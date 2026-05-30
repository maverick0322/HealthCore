import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

import { NutritionPlanContextCard } from '@/features/nutrition-plan/components/NutritionPlanContextCard';
import { NutritionPlanEditorDialog } from '@/features/nutrition-plan/components/NutritionPlanEditorDialog';
import { NutritionPlanGoalsSidebar } from '@/features/nutrition-plan/components/NutritionPlanGoalsSidebar';
import { NutritionPlanSectionCards } from '@/features/nutrition-plan/components/NutritionPlanSectionCards';
import { useNutritionPlanEditor } from '@/features/nutrition-plan/hooks/useNutritionPlanEditor';
import { useNutritionPlanFoodSearch } from '@/features/nutrition-plan/hooks/useNutritionPlanFoodSearch';
import type { NutritionPlanWorkspaceProps } from '@/features/nutrition-plan/types/nutritionPlanWorkspace.types';
import { Card, CardContent } from '@/shared/ui/card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';

export function NutritionPlanWorkspace({
  namespace,
  view,
  observations = [],
  showObservations,
  isLoading = false,
  onSave,
  onSearchFoods,
  onOpenCreateLocalFood,
  onQuickTrack,
  isQuickTracking,
}: Readonly<NutritionPlanWorkspaceProps>) {
  const { t, i18n } = useTranslation(namespace);
  const {
    sections,
    isDirty,
    isSaving,
    editorOpen,
    setEditorOpen,
    editorSection,
    editingOptionId,
    editorState,
    setEditorState,
    editorErrors,
    setEditorErrors,
    pendingDeletion,
    setPendingDeletion,
    saveDraft,
    openCreateDialog,
    openEditDialog,
    confirmRemoveOption,
    addSearchResult,
    updateEditorIngredient,
    removeEditorIngredient,
    saveEditorOption,
  } = useNutritionPlanEditor({
    view,
    onSave,
    t,
  });
  const {
    searchQuery,
    searchResults,
    isSearching,
    searchFeedbackState,
    handleSearchQueryChange,
    resetSearch,
  } = useNutritionPlanFoodSearch({
    editorOpen,
    namespace,
    onSearchFoods,
  });

  const goals = view?.dailyGoals;
  const canEdit = Boolean(view?.canEdit);
  const showRegisterAction = namespace === 'patient' && !canEdit;
  const shouldShowObservations = showObservations ?? namespace === 'patient';
  const sectionSubtitleKey = canEdit
    ? namespace === 'nutritionist'
      ? 'nutritionPlan.sectionSubtitleNutritionist'
      : 'nutritionPlan.sectionSubtitleSelfManaged'
    : 'nutritionPlan.sectionSubtitleReadOnly';
  const emptySectionKey = canEdit
    ? namespace === 'nutritionist'
      ? 'nutritionPlan.emptyEditableNutritionist'
      : 'nutritionPlan.emptyEditablePatient'
    : 'nutritionPlan.emptyReadOnlyPatient';

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardContent className="space-y-4 py-6">
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded-2xl bg-muted" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 animate-pulse rounded-xl bg-muted" />
              <div className="h-16 animate-pulse rounded-xl bg-muted" />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="h-32 animate-pulse py-6" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!view || !goals) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {t('nutritionPlan.unavailable')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <NutritionPlanGoalsSidebar
          namespace={namespace}
          goals={goals}
          canEdit={canEdit}
          isDirty={isDirty}
          isSaving={isSaving}
          shouldShowObservations={shouldShowObservations}
          observations={observations}
          locale={i18n.language}
          onSaveDraft={saveDraft}
        />

        <div className="space-y-8">
          <NutritionPlanSectionCards
            namespace={namespace}
            sections={sections}
            canEdit={canEdit}
            showRegisterAction={showRegisterAction}
            emptySectionKey={emptySectionKey}
            sectionSubtitleKey={sectionSubtitleKey}
            isQuickTracking={isQuickTracking}
            onQuickTrack={onQuickTrack}
            onOpenCreateDialog={(mealSlot) => {
              resetSearch();
              openCreateDialog(mealSlot);
            }}
            onOpenEditDialog={(mealSlot, optionId) => {
              resetSearch();
              openEditDialog(mealSlot, optionId);
            }}
            onRequestDelete={setPendingDeletion}
          />
        </div>
      </div>

      {namespace === 'nutritionist' && view.contextSelfManagedPlan ? (
        <NutritionPlanContextCard namespace={namespace} plan={view.contextSelfManagedPlan} />
      ) : null}

      <NutritionPlanEditorDialog
        namespace={namespace}
        editorOpen={editorOpen}
        editingOptionId={editingOptionId}
        editorSection={editorSection}
        editorState={editorState}
        editorErrors={editorErrors}
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        searchFeedbackState={searchFeedbackState}
        onOpenCreateLocalFood={onOpenCreateLocalFood}
        onOpenChange={setEditorOpen}
        setEditorState={setEditorState}
        setEditorErrors={setEditorErrors}
        onSearchQueryChange={handleSearchQueryChange}
        onSelectSearchResult={(food) => {
          addSearchResult(food);
          resetSearch();
        }}
        onUpdateEditorIngredient={updateEditorIngredient}
        onRemoveEditorIngredient={removeEditorIngredient}
        onSaveEditorOption={saveEditorOption}
      />

      <ConfirmModal
        isOpen={pendingDeletion !== null}
        onClose={() => setPendingDeletion(null)}
        onConfirm={confirmRemoveOption}
        title={t('nutritionPlan.deleteDishTitle')}
        description={t('nutritionPlan.deleteDishDescription', {
          name: pendingDeletion?.optionName ?? '',
        })}
        confirmText={t('nutritionPlan.deleteDishConfirm')}
        cancelText={t('nutritionPlan.cancel')}
        isDestructive
        icon={<Trash2 size={24} />}
      />
    </div>
  );
}
