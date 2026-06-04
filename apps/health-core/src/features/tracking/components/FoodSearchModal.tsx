import React, { useState } from 'react';
import { Search, ScanLine, Plus, Loader2, X, Check, Utensils } from 'lucide-react';
import { useFoodSearch, type SearchResultItem } from '../hooks/useFoodSearch';
import type { SelectedFoodItem } from '../types/tracking.types';

interface FoodSearchModalProps {
  onClose: () => void;
  onSelectFood: (food: SelectedFoodItem) => void;
}

const FoodThumbnail: React.FC<{ src: string | null; alt: string }> = ({ src, alt }) => {
  const [hasError, setHasError] = useState<boolean>(false);

  if (!src || hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
        <Utensils className="w-6 h-6 opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="h-full w-full object-cover transition-opacity duration-300"
      loading="lazy"
    />
  );
};

/**
 * Presentation Component. 
 * Strictly handles rendering the UI and capturing user interactions.
 */
export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({ onClose, onSelectFood }) => {
  // Business logic is fully delegated to the hook
  const { searchTerm, setSearchTerm, results, isLoading, error } = useFoodSearch();
  
  // Local UI state for visual feedback
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const handleSelect = (item: SearchResultItem) => {
    onSelectFood({
      barcode: item.barcode,
      name: item.name,
      baseCalories: item.baseCalories,
      grams: item.grams,
    });

    setAddedItems((prev) => {
      const newSet = new Set(prev);
      newSet.add(item.barcode);
      return newSet;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        
        <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Buscar Alimento</h2>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 relative flex w-full items-center">
            <div className="absolute left-4 flex items-center pointer-events-none text-slate-400">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </div>
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar alimentos (ej. Manzana, Pollo)..."
              className="w-full rounded-xl border-none bg-slate-50 dark:bg-slate-800 py-4 pl-12 pr-14 text-base shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-slate-100"
            />
            <button className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary/20 hover:text-primary transition-colors ring-1 ring-slate-200 dark:ring-slate-600">
              <ScanLine className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-4 mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-center text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {isLoading && results.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Buscando en el catálogo...</p>
            </div>
          )}

          {!isLoading && searchTerm.trim().length >= 3 && results.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Search className="h-12 w-12 text-slate-300 mb-4" />
              <p>No se encontraron alimentos para "{searchTerm}".</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="flex flex-col gap-3">
              {results.map((item) => {
                const isAdded = addedItems.has(item.barcode);

                return (
                  <div
                    key={item.barcode}
                    className={`group flex items-center justify-between gap-4 rounded-xl p-3 shadow-sm ring-1 transition-all ${
                      isAdded 
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 ring-emerald-200 dark:ring-emerald-800 cursor-default' 
                        : 'bg-white dark:bg-slate-800/50 ring-slate-200 dark:ring-slate-700 hover:ring-2 hover:ring-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-14 w-14 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0">
                        <FoodThumbnail src={item.imgUrl} alt={item.name} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-base font-bold transition-colors line-clamp-1 ${
                          isAdded ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white group-hover:text-primary'
                        }`}>
                          {item.name}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {item.baseCalories} kcal / 100g
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => !isAdded && handleSelect(item)}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${
                        isAdded 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                      }`}
                      disabled={isAdded}
                    >
                      {isAdded ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
