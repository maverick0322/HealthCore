import React, { useState, useMemo } from 'react';
import { CheckCircle2, Calendar, Clock, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLogFood } from '../hooks/useLogFood';
import type { SelectedFoodItem } from '../types/tracking.types';
import { MealPhotoCapture } from './MealPhotoCapture';

interface FoodLogFormProps {
  selectedFoods: SelectedFoodItem[];
  onFoodsChange: (foods: SelectedFoodItem[]) => void;
  // It's a best practice to pass the 'now' context if we need strict consistency,
  // but generating it internally here is acceptable for purely visual display.
}

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

/**
 * Presentation Component.
 * SRP: Strictly responsible for rendering the form UI, capturing user input, 
 * and delegating data manipulation to the parent or custom hooks.
 */
export const FoodLogForm: React.FC<FoodLogFormProps> = ({ selectedFoods, onFoodsChange }) => {
  const { t } = useTranslation('tracking');
  const { logFood, isLoading, error, isSuccess } = useLogFood();
  
  const [mealName, setMealName] = useState<string>(''); // <-- Nuevo campo de nombre
  const [mealType, setMealType] = useState<MealType>('BREAKFAST');
  const [uploadedPhotoKey, setUploadedPhotoKey] = useState<string | undefined>(undefined);
  
  // Memoizing static display values to prevent unnecessary recalculations on re-renders
  const { displayDate, displayTime, currentIsoDate } = useMemo(() => {
    const now = new Date();
    return {
      displayDate: now.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      displayTime: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      currentIsoDate: now.toISOString(),
    };
  }, []);

  // Memoizing configuration objects to avoid recreation on every render cycle
  const mealOptions = useMemo(() => [
    { key: 'BREAKFAST', label: t('meals.breakfast', 'Desayuno') },
    { key: 'LUNCH', label: t('meals.lunch', 'Comida') },
    { key: 'DINNER', label: t('meals.dinner', 'Cena') },
    { key: 'SNACK', label: t('meals.snack', 'Snack') }
  ] as const, [t]);

  const handleRegister = async () => {
    // The component simply aggregates its local state and the props, 
    // delegating the actual network request entirely to the hook.
    await logFood({
      mealName: mealName.trim() || t(`meals.${mealType.toLowerCase()}`),
      mealType,
      consumedAt: currentIsoDate,
      photoKey: uploadedPhotoKey,
      foods: selectedFoods.map(({ barcode, grams }) => ({ barcode, grams }))
    });
  };

  const handleGramsChange = (barcode: string, newGrams: number) => {
    // Defensive check: Ensure we don't dispatch negative or zero grams to the parent
    const safeGrams = Math.max(1, newGrams);
    onFoodsChange(selectedFoods.map(food => 
      food.barcode === barcode ? { ...food, grams: safeGrams } : food
    ));
  };

  const handleRemove = (barcode: string) => {
    onFoodsChange(selectedFoods.filter(food => food.barcode !== barcode));
  };

  if (isSuccess) {
    // FIX: Replaced 'rounded-t-3xl' with 'rounded-3xl' to fix the cut-off bottom visual bug.
    // Added 'mb-4' to ensure it doesn't stick to elements below it.
    return (
      <div className="mt-4 mb-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 text-center flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-4" strokeWidth={1.5} />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('successTitle', '¡Registro Exitoso!')}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{t('successMessage', 'Tus alimentos han sido guardados.')}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700"></div>
      
      <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Resumen de Comida</h2>

      {/* NUEVO: Nombre del Platillo */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="mealNameInput" className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            ¿Qué comiste? <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-slate-400 font-medium">{mealName.length}/60</span>
        </div>
        <input 
          id="mealNameInput"
          type="text"
          maxLength={60}
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          placeholder="Ej. Avena Integralcon frutos rojos"
          className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5 text-sm font-medium text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700 focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Tipo de Comida */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-400">{t('mealType', 'Tipo de comida')}</p>
        <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 p-1">
          {mealOptions.map((meal) => (
            <button 
              key={meal.key}
              onClick={() => setMealType(meal.key)}
              className={`rounded-lg py-2.5 text-xs sm:text-sm font-medium transition-all ${
                mealType === meal.key 
                  ? 'bg-white dark:bg-slate-700 font-bold text-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {meal.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Alimentos Seleccionados */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Alimentos ({selectedFoods.length})</p>
        <div className="flex flex-col gap-3">
          {selectedFoods.map((food) => (
            <div key={food.barcode} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={food.name}>
                  {food.name}
                </p>
                <p className="text-xs text-slate-500">{food.baseCalories} kcal base</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <input 
                    type="number" 
                    min="1"
                    value={food.grams}
                    onChange={(e) => handleGramsChange(food.barcode, Number(e.target.value))}
                    className="w-12 text-right text-sm font-semibold bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-white outline-none"
                  />
                  <span className="text-xs text-slate-500 font-medium">g</span>
                </div>
                <button 
                  onClick={() => handleRemove(food.barcode)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  aria-label="Remove food item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fecha y Hora */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('date', 'Fecha')}</label>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 p-3 ring-1 ring-slate-200 dark:ring-slate-700">
            <Calendar className="w-5 h-5 text-slate-400" />
            <input className="w-full border-none bg-transparent p-0 text-sm focus:ring-0 outline-none text-slate-900 dark:text-slate-100" readOnly type="text" value={`Hoy, ${displayDate}`}/>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('time', 'Hora')}</label>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 p-3 ring-1 ring-slate-200 dark:ring-slate-700">
            <Clock className="w-5 h-5 text-slate-400" />
            <input className="w-full border-none bg-transparent p-0 text-sm focus:ring-0 outline-none text-slate-900 dark:text-slate-100" readOnly type="text" value={displayTime}/>
          </div>
        </div>
      </div>

      {/* Sección Multimedia */}
      <div className="mb-8 flex flex-col gap-3">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('foodPhoto', 'Foto del Platillo')}</p>
        <MealPhotoCapture 
          onPhotoUploaded={(storageKey) => setUploadedPhotoKey(storageKey)} 
        />
      </div>

      {/* Manejo de Errores de Registro */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium text-center">{error}</p>
        </div>
      )}

      {/* Botón de Registro */}
      <button 
        onClick={handleRegister}
        disabled={isLoading || selectedFoods.length === 0 || mealName.trim().length === 0}
        className="w-full rounded-xl bg-primary py-4 text-center text-lg font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
      >
        {isLoading ? t('saving', 'Guardando...') : t('registerFood', 'Registrar Alimento')}
      </button>
    </div>
  );
};