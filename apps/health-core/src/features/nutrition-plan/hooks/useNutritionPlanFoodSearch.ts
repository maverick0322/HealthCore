import { useEffect, useState } from 'react';

import { logClientWarn } from '@/core/utils/logger';
import type { CatalogFoodResponse } from '@/features/clinical/types/clinical.types';
import type { Namespace, SearchFeedbackState } from '@/features/nutrition-plan/types/nutritionPlanWorkspace.types';

interface UseNutritionPlanFoodSearchParams {
  editorOpen: boolean;
  namespace: Namespace;
  onSearchFoods?: (query: string) => Promise<CatalogFoodResponse[]>;
}

export const useNutritionPlanFoodSearch = ({
  editorOpen,
  namespace,
  onSearchFoods,
}: UseNutritionPlanFoodSearchParams) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CatalogFoodResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedbackState, setSearchFeedbackState] = useState<SearchFeedbackState>('idle');

  useEffect(() => {
    if (!editorOpen || !onSearchFoods || searchQuery.trim().length < 3) {
      setSearchResults([]);
      setSearchFeedbackState('idle');
      return;
    }

    const handle = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await onSearchFoods(searchQuery.trim());
        setSearchResults(results);
        setSearchFeedbackState(results.length === 0 ? 'no-results' : 'idle');
      } catch (error) {
        logClientWarn('NutritionPlanWorkspace.search.error', {
          namespace,
          query: searchQuery.trim(),
          error,
        });
        setSearchResults([]);
        setSearchFeedbackState('service-unavailable');
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [editorOpen, namespace, onSearchFoods, searchQuery]);

  const resetSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchFeedbackState('idle');
  };

  const handleSearchQueryChange = (value: string) => {
    if (value.length <= 100) {
      setSearchQuery(value);
      setSearchFeedbackState('idle');
    }
  };

  return {
    searchQuery,
    searchResults,
    isSearching,
    searchFeedbackState,
    setSearchFeedbackState,
    setSearchResults,
    handleSearchQueryChange,
    resetSearch,
  };
};
