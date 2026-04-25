import React, { useState } from 'react';
import { Bell, Apple } from 'lucide-react'; // Apple funciona genial como ícono de nutrición
import { FoodSearch, type FoodItemData } from '../components/FoodSearch';
import { FoodLogForm } from '../components/FoodLogForm';

export const LogFoodPage = () => {
  const [selectedFood, setSelectedFood] = useState<FoodItemData | null>(null);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-sans">
      
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between border-b border-primary/10 bg-white dark:bg-[#181b17] px-6 py-4 sticky top-0 z-10 shadow-sm transition-colors">        
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <Apple className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">HealthCore</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <div className="h-10 w-10 rounded-full border-2 border-primary/20 bg-slate-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
            {/* Foto de perfil placeholder */}
            <img alt="Perfil" className="h-full w-full object-cover" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col px-4 py-6 md:px-20 lg:px-40 max-w-5xl mx-auto w-full">
        
        {/* 1. Componente de Búsqueda */}
        <FoodSearch onFoodSelect={(food) => setSelectedFood(food)} />

        {/* 2. Drawer de Formulario */}
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