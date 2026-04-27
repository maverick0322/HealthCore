import React, { useState, useEffect } from 'react';
import { Search, ScanLine, Plus, Loader2 } from 'lucide-react';
import { trackingService } from '../services/trackingService';
import { useTranslation } from 'react-i18next';

export interface FoodItemData {
  barcode: string;
  name: string;
  cal: number;
  img: string;
}

interface FoodSearchProps {
  onFoodSelect: (food: FoodItemData) => void;
}

export const FoodSearch: React.FC<FoodSearchProps> = ({ onFoodSelect }) => {
  const { t } = useTranslation('tracking');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<FoodItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 2) {
        setIsLoading(true);
        try {
          const response = await trackingService.searchFood(searchTerm);

          const mappedResults = response.map((item: any) => ({
            barcode: item.barcode,
            name: item.name,
            cal: item.caloriesPer100g,
            img: item.imageUrl || 'https://via.placeholder.com/150?text=Sin+Foto'
          }));

          setResults(mappedResults);
        } catch (error) {
          console.error("Error buscando alimentos:", error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="w-full">
      {/* Barra de Búsqueda Inteligente */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="relative flex w-full items-center">
          <div className="absolute left-4 flex items-center pointer-events-none text-slate-400">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar alimentos (ej. Manzana, Pollo)..."
            className="w-full rounded-xl border-none bg-white dark:bg-slate-800 py-4 pl-12 pr-14 text-base shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-slate-100"
          />
          <button className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary/20 hover:text-primary transition-colors">
            <ScanLine className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Lista de Resultados Reales */}
      {results.length > 0 && (
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('searchResults')}</h3>
          </div>

          {results.map((item) => (
            <div
              key={item.barcode}
              onClick={() => onFoodSelect(item)}
              className="group flex items-center justify-between gap-4 rounded-xl bg-white dark:bg-slate-800 p-3 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-primary/50 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0">
                  <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">{item.name}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{item.cal} kcal / 100g</span>
                </div>
              </div>
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};