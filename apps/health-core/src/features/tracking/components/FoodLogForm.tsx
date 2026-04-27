import React, { useState } from 'react';
import { CheckCircle2, Calendar, Clock, Camera, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLogFood } from '../hooks/useLogFood';

interface FoodLogFormProps {
  selectedBarcode: string; 
  foodName: string;
  baseCalories: number;
}

export const FoodLogForm: React.FC<FoodLogFormProps> = ({ selectedBarcode, foodName, baseCalories }) => {
  const { t } = useTranslation('tracking');
  const { logFood, isLoading, error, isSuccess } = useLogFood();
  const [mealType, setMealType] = useState('breakfast');
  const [portions, setPortions] = useState(1.5);

  const handleRegister = async () => {
    const grams = portions * 100;
    console.log('Logging food:', { selectedBarcode, baseCalories, grams, mealType });
    await logFood({ barcode: selectedBarcode, grams });
  };

  const mealOptions = [
    { key: 'breakfast', label: t('meals.breakfast') },
    { key: 'lunch', label: t('meals.lunch') },
    { key: 'dinner', label: t('meals.dinner') },
    { key: 'snack', label: t('meals.snack') }
  ];

  if (isSuccess) {
    return (
      <div className="mt-4 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 text-center flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 duration-300">
        <CheckCircle2 className="w-20 h-20 text-primary mb-4" strokeWidth={1.5} />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('successTitle')}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{t('successMessage')}</p>
      </div>
    );
  }

  // Vista del Formulario Completo
  return (
    <div className="mt-4 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700"></div>
      
      <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">{t('registerFood')} - {foodName}</h2>

      {/* Tipo de Comida */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-400">{t('mealType')}</p>
        <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 p-1">
          {mealOptions.map((meal) => (
            <button 
              key={meal.key}
              onClick={() => setMealType(meal.key)}
              className={`rounded-lg py-2.5 text-sm font-medium transition-all ${
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

      {/* Fecha y Hora (Visuales según mockup) */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('date')}</label>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 p-3 ring-1 ring-slate-200 dark:ring-slate-700">
            <Calendar className="w-5 h-5 text-slate-400" />
            <input className="w-full border-none bg-transparent p-0 text-sm focus:ring-0 outline-none text-slate-900 dark:text-slate-100" readOnly type="text" value="Hoy, 24 Oct"/>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('time')}</label>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 p-3 ring-1 ring-slate-200 dark:ring-slate-700">
            <Clock className="w-5 h-5 text-slate-400" />
            <input className="w-full border-none bg-transparent p-0 text-sm focus:ring-0 outline-none text-slate-900 dark:text-slate-100" readOnly type="text" value="08:30 AM"/>
          </div>
        </div>
      </div>

      {/* Tamaño de Porción */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('portionSize')}</label>
          <span className="text-lg font-bold text-primary">{t('portions', { count: portions.toFixed(1) })}</span>
        </div>
        <div className="px-2">
          <input 
            type="range" 
            min="0.5" max="5" step="0.5" 
            value={portions}
            onChange={(e) => setPortions(parseFloat(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700 accent-primary" 
          />
        </div>
      </div>

      {/* Sección Multimedia (Foto) */}
      <div className="mb-8 flex flex-col gap-3">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('foodPhoto')}</p>
        <div className="flex items-center gap-4">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-4 text-slate-500 hover:border-primary hover:text-primary transition-all">
            <Camera className="w-5 h-5" />
            <span className="text-sm font-medium">{t('uploadPhoto')}</span>
          </button>
          <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
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
        disabled={isLoading}
        className="w-full rounded-xl bg-primary py-4 text-center text-lg font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
      >
        {isLoading ? t('saving') : t('registerFood')}
      </button>
    </div>
  );
};