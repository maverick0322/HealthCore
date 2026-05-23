import { useState, useEffect } from 'react';
import { trackingService } from '../services/trackingService';
import type { SelectedFoodItem } from '../types/tracking.types';

export interface SearchResultItem extends SelectedFoodItem {
  imgUrl: string | null;
}

const SEARCH_CONFIG = {
  MIN_LENGTH: 3,
  DEBOUNCE_DELAY_MS: 1000, // 1 second: Perfect balance between saving API calls and good UX
  DEFAULT_PORTION_GRAMS: 100,
} as const;

interface UseFoodSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  results: SearchResultItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook responsible for the food search business logic.
 * Encapsulates debouncing, API communication, and data mapping, adhering to SRP.
 */
export const useFoodSearch = (): UseFoodSearchReturn => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const sanitizedTerm = searchTerm.trim();
      
      if (sanitizedTerm.length >= SEARCH_CONFIG.MIN_LENGTH) {
        await executeSearch(sanitizedTerm);
      } else {
        // Clear results immediately if user deletes the text
        setResults([]);
        setError(null);
      }
    }, SEARCH_CONFIG.DEBOUNCE_DELAY_MS);

    // Cleanup function: Destroys the pending API call if the user types again
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const executeSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await trackingService.searchFood(query);

      if (!Array.isArray(response)) {
        throw new TypeError('Invalid API response format.');
      }

      const mappedResults: SearchResultItem[] = response.map((item: any) => ({
        barcode: item.barcode,
        name: item.name,
        baseCalories: item.calories,
        grams: SEARCH_CONFIG.DEFAULT_PORTION_GRAMS,
        imgUrl: item.imageUrl || null,
      }));

      setResults(mappedResults);
    } catch (err: unknown) {
      setError('No se pudo conectar con el catálogo. Intenta de nuevo.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return { searchTerm, setSearchTerm, results, isLoading, error };
};