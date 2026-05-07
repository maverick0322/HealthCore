import React, { useState } from 'react';
import { CheckCircle2, Calendar, Clock, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLogFood } from '../hooks/useLogFood';
import type { SelectedFoodItem } from '../types/tracking.types';

interface FoodLogFormProps {
  selectedFoods: SelectedFoodItem[];
  onFoodsChange: (foods: SelectedFoodItem[]) => void;
}

export const FoodLogForm: React.FC<FoodLogFormProps> = ({ selectedFoods, onFoodsChange }) => {
  const { t } = useTranslation('tracking');
  const { logFood, isLoading, error, isSuccess } = useLogFood();
  const [mealType, setMealType] = useState('BREAKFAST');
  
  const now = new Date();
  const displayDate = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const displayTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const handleRegister = async () => {
    const payload = {
      mealType: mealType,
      consumedAt: now.toISOString(), // ISO-8601 para el backend
      // photoKey: "image_10741c.png", // Descomentar cuando implementemos la subida a S3/Blob
      foods: selectedFoods.map(food => ({
        barcode: food.barcode,
        grams: food.grams
      }))
    };

    console.log('Enviando al backend:', payload);
    await logFood(payload);
  };

  const updateFoodGrams = (barcode: string, newGrams: number) => {
    const updatedFoods = selectedFoods.map(food => 
      food.barcode === barcode ? { ...food, grams: newGrams } : food
    );
    onFoodsChange(updatedFoods);
  };

  const removeFood = (barcode: string) => {
    const filteredFoods = selectedFoods.filter(food => food.barcode !== barcode);
    onFoodsChange(filteredFoods);
  };

  const mealOptions = [
    { key: 'BREAKFAST', label: t('meals.breakfast', 'Desayuno') },
    { key: 'LUNCH', label: t('meals.lunch', 'Comida') },
    { key: 'DINNER', label: t('meals.dinner', 'Cena') },
    { key: 'SNACK', label: t('meals.snack', 'Snack') }
  ];

  if (isSuccess) {
    return (
      <div className="mt-4 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 text-center flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 duration-300">
        <CheckCircle2 className="w-20 h-20 text-primary mb-4" strokeWidth={1.5} />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('successTitle', '¡Registro Exitoso!')}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{t('successMessage', 'Tus alimentos han sido guardados.')}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700"></div>
      
      <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Resumen de Comida</h2>

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
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{food.name}</p>
                <p className="text-xs text-slate-500">{food.baseCalories} kcal base</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <input 
                    type="number" 
                    min="1"
                    value={food.grams}
                    onChange={(e) => updateFoodGrams(food.barcode, Number(e.target.value))}
                    className="w-12 text-right text-sm font-semibold bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-white outline-none"
                  />
                  <span className="text-xs text-slate-500 font-medium">g</span>
                </div>
                <button 
                  onClick={() => removeFood(food.barcode)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
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

      {/* Sección Multimedia (Foto) */}
      <div className="mb-8 flex flex-col gap-3">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('foodPhoto', 'Evidencia Visual')}</p>
        <div className="flex items-center gap-4">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-4 text-slate-500 hover:border-primary hover:text-primary transition-all">
            <Camera className="w-5 h-5" />
            <span className="text-sm font-medium">{t('uploadPhoto', 'Añadir Foto')}</span>
          </button>
          <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 overflow-hidden">
             {/* Aquí en el futuro puedes poner el tag <img> con el blob */}
            <ImageIcon className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Manejo de Errores */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium text-center">{error}</p>
        </div>
      )}

      {/* Botón de Registro */}
      <button 
        onClick={handleRegister}
        disabled={isLoading || selectedFoods.length === 0}
        className="w-full rounded-xl bg-primary py-4 text-center text-lg font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
      >
        {isLoading ? t('saving', 'Guardando...') : t('registerFood', 'Registrar Comida')}
      </button>
    </div>
  );
};