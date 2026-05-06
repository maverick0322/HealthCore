import React, { useState, useEffect } from 'react';
import { Search, ScanLine, Plus, Loader2, X } from 'lucide-react';
import { trackingService } from '../services/trackingService';
import { useTranslation } from 'react-i18next';
import type { SelectedFoodItem } from '../types/tracking.types';

// Extendemos temporalmente el tipo local para incluir la imagen que solo vive en la búsqueda
interface SearchResultItem extends SelectedFoodItem {
  img: string;
}

interface FoodSearchModalProps {
  onClose: () => void;
  onSelectFood: (food: SelectedFoodItem) => void;
}

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({ onClose, onSelectFood }) => {
  const { t } = useTranslation('tracking');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 2) {
        setIsLoading(true);
        try {
          const response = await trackingService.searchFood(searchTerm);

          // Alineado exactamente con el record FoodNutrients de Java
          const mappedResults: SearchResultItem[] = response.map((item: any) => ({
            barcode: item.barcode,
            name: item.name,
            baseCalories: item.calories, // Actualizado de caloriesPer100g a calories
            grams: 100, // Gramaje por defecto al agregar al "carrito"
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
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelect = (item: SearchResultItem) => {
    // Extraemos solo lo que le importa al formulario (quitamos la img)
    onSelectFood({
      barcode: item.barcode,
      name: item.name,
      baseCalories: item.baseCalories,
      grams: item.grams
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Buscar Alimento</h2>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Cuerpo Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Barra de Búsqueda */}
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

          {/* Estado de carga */}
          {isLoading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Buscando en el catálogo de FatSecret...</p>
            </div>
          )}

          {/* Lista de Resultados */}
          {results.length > 0 && (
            <div className="flex flex-col gap-3">
              {results.map((item) => (
                <div
                  key={item.barcode}
                  onClick={() => handleSelect(item)}
                  className="group flex items-center justify-between gap-4 rounded-xl bg-white dark:bg-slate-800/50 p-3 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-2 hover:ring-primary/50 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0">
                      <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">{item.name}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{item.baseCalories} kcal / 100g</span>
                    </div>
                  </div>
                  <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Estado vacío (cuando ya buscó pero no encontró) */}
          {!isLoading && searchTerm.length > 2 && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Search className="h-12 w-12 text-slate-300 mb-4" />
              <p>No se encontraron alimentos para "{searchTerm}".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};