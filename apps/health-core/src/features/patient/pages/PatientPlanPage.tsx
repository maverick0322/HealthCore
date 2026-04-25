import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  UtensilsCrossed,
  Flame,
  Droplets,
  CheckCircle2,
  Circle,
  FileDown,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { PatientNav } from "@/features/patient/components/PatientNav";

// ── Dummy data ─────────────────────────────────────────────────────────────

const PLAN_DUMMY = {
  goals: {
    calories: 2000,
    protein: 130,
    carbs: 200,
    fat: 65,
    water: 8,
  },
  meals: [
    {
      id: "breakfast",
      type: "breakfast",
      name: "Avena Proteica con Frutos Rojos",
      time: "08:00 - 09:30",
      macros: { kcal: 420, p: 25, c: 55, f: 12 },
      ingredients: [
        "60g Avena en hojuelas",
        "1 scoop (30g) Proteína Whey vainilla",
        "150ml Leche de almendras sin azúcar",
        "50g Arándanos",
        "10g Semillas de chía",
      ],
      instructions: "Mezclar la avena con la leche y dejar reposar 5 min. Agregar la proteína, mezclar bien y decorar con los arándanos y chía.",
      substitutions: "Leche de almendras por leche descremada. Arándanos por fresas.",
      eaten: true,
    },
    {
      id: "snack1",
      type: "snack",
      name: "Yogur Griego con Almendras",
      time: "11:30 - 12:00",
      macros: { kcal: 180, p: 15, c: 10, f: 9 },
      ingredients: [
        "150g Yogur griego natural (sin azúcar)",
        "15g Almendras fileteadas",
      ],
      instructions: "Servir frío.",
      substitutions: "Almendras por nueces.",
      eaten: false,
    },
    {
      id: "lunch",
      type: "lunch",
      name: "Bowl de Pollo y Quinoa",
      time: "14:00 - 15:30",
      macros: { kcal: 650, p: 45, c: 70, f: 20 },
      ingredients: [
        "150g Pechuga de pollo a la plancha",
        "80g Quinoa cocida",
        "100g Brócoli al vapor",
        "50g Aguacate",
        "1 cdta Aceite de oliva",
      ],
      instructions: "Cocinar el pollo a la plancha con sal y pimienta. Servir sobre una base de quinoa junto con el brócoli y aguacate rebanado. Aliñar con aceite de oliva.",
      substitutions: "Pollo por pavo o tofu. Quinoa por arroz integral.",
      eaten: false,
    },
    {
      id: "dinner",
      type: "dinner",
      name: "Salmón con Espárragos",
      time: "19:30 - 21:00",
      macros: { kcal: 450, p: 35, c: 15, f: 26 },
      ingredients: [
        "150g Filete de salmón",
        "150g Espárragos",
        "1/2 Limón",
        "Sal y pimienta al gusto",
      ],
      instructions: "Hornear el salmón y los espárragos a 200°C por 15-20 minutos. Exprimir jugo de limón al servir.",
      substitutions: "Salmón por atún fresco. Espárragos por ejotes.",
      eaten: false,
    },
  ],
};

// ── Components ─────────────────────────────────────────────────────────────

function MacroPill({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <div className={`flex flex-col items-center justify-center bg-background rounded-lg border p-2 ${colorClass}`}>
      <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">{label}</span>
      <span className="text-sm font-extrabold">{value}</span>
    </div>
  );
}

function MealCard({ meal, toggleEaten }: { meal: any; toggleEaten: (id: string) => void }) {
  const { t } = useTranslation("patient");
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${meal.eaten ? 'border-primary/50 bg-primary/5' : ''}`}>
      {/* Card Header (Always visible) */}
      <div
        className="p-4 sm:p-5 flex items-start gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); toggleEaten(meal.id); }}
          className="mt-1 flex-shrink-0 focus:outline-none focus-visible:ring-2 ring-primary rounded-full"
        >
          {meal.eaten ? (
            <CheckCircle2 size={24} className="text-primary fill-primary/20" />
          ) : (
            <Circle size={24} className="text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded-sm">
                {t(`plan.${meal.type}`)}
              </span>
              <h3 className="text-base sm:text-lg font-bold mt-1.5 line-clamp-1">{meal.name}</h3>
            </div>
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap ml-2">
              {meal.time}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            <span className="font-semibold text-primary">{meal.macros.kcal} {t("plan.calories")}</span>
            <span className="text-muted-foreground">{meal.macros.p}g P</span>
            <span className="text-muted-foreground">{meal.macros.c}g C</span>
            <span className="text-muted-foreground">{meal.macros.f}g G</span>
          </div>
        </div>

        <button className="text-muted-foreground hover:text-foreground transition-colors self-center ml-2">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Expanded Content */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 sm:p-5 pt-0 border-t border-border/50 space-y-4 bg-muted/10">

            {/* Ingredients */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <UtensilsCrossed size={14} />
                {t("plan.ingredients")}
              </h4>
              <ul className="space-y-1.5 text-sm">
                {meal.ingredients.map((ing: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {t("plan.instructions")}
              </h4>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {meal.instructions}
              </p>
            </div>

            {/* Substitutions */}
            {meal.substitutions && (
              <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                  <Info size={12} />
                  {t("plan.substitutions")}
                </h4>
                <p className="text-xs text-amber-600/90 dark:text-amber-400/90">
                  {meal.substitutions}
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export const PatientPlanPage = () => {
  const { t } = useTranslation("patient");
  const [meals, setMeals] = useState(PLAN_DUMMY.meals);

  const toggleEaten = (id: string) => {
    setMeals(meals.map(m => m.id === id ? { ...m, eaten: !m.eaten } : m));
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <PatientNav />

      {/* ── Top Controls ───────────────────────────────────────── */}
      <div className="md:pl-56">
        <SettingsBar />
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t("plan.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("plan.subtitle")}
            </p>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
            <FileDown size={16} />
            {t("plan.downloadPdf")}
          </Button>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-8 md:pl-56 animate-in fade-in slide-in-from-bottom-2 duration-500">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column: Daily Goals & Summary (Sticky on Desktop) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <Card>
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Flame size={18} className="text-primary" />
                  {t("plan.dailyGoals")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">

                {/* Calories main metric */}
                <div className="flex items-end gap-2 border-b border-border/50 pb-4">
                  <span className="text-4xl font-black tracking-tighter text-primary">
                    {PLAN_DUMMY.goals.calories}
                  </span>
                  <span className="text-sm text-muted-foreground font-semibold mb-1">
                    {t("plan.calories")} / día
                  </span>
                </div>

                {/* Macro Pills */}
                <div className="grid grid-cols-3 gap-2">
                  <MacroPill label={t("plan.protein")} value={`${PLAN_DUMMY.goals.protein}g`} colorClass="text-primary border-primary/20 bg-primary/5" />
                  <MacroPill label={t("plan.carbs")} value={`${PLAN_DUMMY.goals.carbs}g`} colorClass="text-amber-500 border-amber-500/20 bg-amber-500/5" />
                  <MacroPill label={t("plan.fat")} value={`${PLAN_DUMMY.goals.fat}g`} colorClass="text-sky-500 border-sky-500/20 bg-sky-500/5" />
                </div>

                {/* Hydration Goal */}
                <div className="flex items-center gap-3 bg-sky-500/10 rounded-xl p-3 border border-sky-500/20">
                  <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-500">
                    <Droplets size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                      {t("plan.waterGoal", { count: PLAN_DUMMY.goals.water })}
                    </p>
                    <p className="text-xs text-sky-600/70 dark:text-sky-400/70">
                      {(PLAN_DUMMY.goals.water * 250) / 1000} Litros aprox.
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>

            <Button variant="outline" className="w-full sm:hidden gap-2">
              <FileDown size={16} />
              {t("plan.downloadPdf")}
            </Button>
          </div>

          {/* Right Column: Meal List */}
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-lg font-bold tracking-tight mb-2">
              {t("plan.meals")}
            </h2>
            <div className="space-y-4">
              {meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  toggleEaten={toggleEaten}
                />
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
