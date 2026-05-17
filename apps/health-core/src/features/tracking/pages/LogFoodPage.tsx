import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react'; // <-- Agregamos un icono de +
import { PatientNav } from '@/features/patient/components/PatientNav';
import { SettingsBar } from '@/shared/components/SettingsBar';

import { FoodSearchModal } from '../components/FoodSearchModal'; // <-- Tu nuevo modal (lo haremos en el siguiente paso)
import { FoodLogForm } from '../components/FoodLogForm';
import type { SelectedFoodItem } from '../types/tracking.types';

export const LogFoodPage = () => {
  const { t } = useTranslation('tracking');
     
  // Nuestro "carrito" local de alimentos
  const [selectedFoods, setSelectedFoods] = useState<SelectedFoodItem[]>([]);
  
  // Control del modal
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const handleAddFood = (food: SelectedFoodItem) => {
    // Verificamos si ya está en la lista para no duplicarlo
    if (!selectedFoods.some(item => item.barcode === food.barcode)) {
      setSelectedFoods([...selectedFoods, food]);
    }
    // Opcional: setIsSearchModalOpen(false) si quieres que el modal se cierre tras agregar uno solo.
    // Si quieres que agreguen varios a la vez, lo dejas abierto.
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <PatientNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div aria-hidden className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t('registerFood')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('searchPlaceholder')}
            </p>
          </div>
          
          {/* Botón flotante/secundario para abrir el modal */}
          <button 
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl shadow-md hover:bg-primary/90 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Agregar Alimento</span>
          </button>
        </div>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-6 md:pl-56 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* Si no hay alimentos, mostramos un estado vacío amable */}
        {selectedFoods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-slate-500 dark:text-slate-400 mb-4">No has agregado alimentos aún.</p>
            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="text-primary font-semibold hover:underline"
            >
              Buscar en el catálogo
            </button>
          </div>
        ) : (
          /* Si hay alimentos, renderizamos el formulario pasándole la lista */
          <FoodLogForm 
            selectedFoods={selectedFoods} 
            onFoodsChange={setSelectedFoods} 
          />
        )}
        
      </main>

      {/* Renderizamos el Modal por encima de todo */}
      {isSearchModalOpen && (
        <FoodSearchModal 
          onClose={() => setIsSearchModalOpen(false)} 
          onSelectFood={handleAddFood} 
        />
      )}
    </div>
  );
};