import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FoodSearch, type FoodItemData } from '../components/FoodSearch';
import { FoodLogForm } from '../components/FoodLogForm';
import { PatientNav } from '@/features/patient/components/PatientNav';
import { SettingsBar } from '@/shared/components/SettingsBar';

export const LogFoodPage = () => {
  const { t } = useTranslation('tracking');
  const [selectedFood, setSelectedFood] = useState<FoodItemData | null>(null);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      {/* ── Responsive Nav (sidebar desktop / bottom bar mobile) ── */}
      <PatientNav />

      {/* ── Top Controls ─────────────────────────────────────────── */}
      <div className="md:pl-56">
        <SettingsBar />
      </div>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t('registerFood')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('searchPlaceholder')}
          </p>
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────────── */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-6 md:pl-56 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* 1. Search Component */}
        <FoodSearch onFoodSelect={(food) => setSelectedFood(food)} />

        {/* 2. Form Drawer */}
        {selectedFood && (
          <FoodLogForm 
            selectedBarcode={selectedFood.barcode} 
            foodName={selectedFood.name} 
            baseCalories={selectedFood.cal} 
          />
        )}
        
      </main>
    </div>
  );
};