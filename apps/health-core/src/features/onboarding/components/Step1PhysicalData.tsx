import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { usePatientOnboardingStore } from "../store/usePatientOnboardingStore";

export const Step1PhysicalData = () => {
  const { t } = useTranslation("onboarding");
  const { physical, setPhysicalData, nextStep } = usePatientOnboardingStore();

  const handleNext = () => nextStep();

  // Opciones tipadas para el nivel de actividad
  const activityOptions = ["SEDENTARY", "LIGHTLY_ACTIVE", "MODERATELY_ACTIVE", "VERY_ACTIVE", "EXTRA_ACTIVE"] as const;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col gap-8 pb-10">
      
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">{t("step1.title", "Cuéntanos sobre ti")}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">{t("step1.subtitle", "Estos datos nos ayudan a personalizar tu plan.")}</p>
      </div>

      {/* Form Container */}
      <div className="flex flex-col gap-8 mt-4">
        
        {/* Age Input */}
        <div className="flex flex-col gap-3">
          <label className="text-base font-semibold text-foreground">{t("step1.age", "Edad")}</label>
          <div className="flex items-center justify-between bg-card border border-border p-2 rounded-xl shadow-sm transition-colors">
            <button 
              onClick={() => setPhysicalData({ age: Math.max(1, physical.age - 1) })}
              className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <span className="w-24 text-center text-2xl font-bold bg-transparent text-foreground">{physical.age}</span>
            <button 
              onClick={() => setPhysicalData({ age: physical.age + 1 })}
              className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        </div>

        {/* Height Input */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-base font-semibold text-foreground flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" ry="2"/><line x1="6" y1="6" x2="6" y2="9"/><line x1="10" y1="6" x2="10" y2="12"/><line x1="14" y1="6" x2="14" y2="9"/><line x1="18" y1="6" x2="18" y2="12"/></svg>
              {t("step1.height", "Estatura (cm)")}
            </label>
            <span className="text-2xl font-bold text-primary">{physical.height}</span>
          </div>
          <div className="relative bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden transition-colors">
            <div className="flex items-end justify-center gap-2 h-16 opacity-40 select-none pointer-events-none pb-4">
              {[...Array(17)].map((_, i) => (
                <div key={i} className={`w-0.5 ${(i % 4 === 0) ? 'h-8 bg-muted-foreground' : (i % 8 === 0) ? 'h-12 bg-primary' : 'h-4 bg-muted-foreground/60'}`}></div>
              ))}
            </div>
            <input 
              type="range" min="100" max="250" value={physical.height} 
              onChange={(e) => setPhysicalData({ height: parseInt(e.target.value) })}
              className="absolute inset-x-0 bottom-4 w-full h-2 bg-transparent appearance-none cursor-pointer accent-primary" 
            />
          </div>
        </div>

        {/* Weight Input */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-base font-semibold text-foreground flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="2" width="18" height="20" rx="2"/><path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M7 16h10"/><path d="M7 20h10"/></svg>
              {t("step1.weight", "Peso (kg)")}
            </label>
            <span className="text-2xl font-bold text-primary">{physical.weight}</span>
          </div>
          <div className="relative bg-card border border-border rounded-xl p-6 shadow-sm transition-colors">
            <input 
              type="range" min="40" max="200" step="0.5" value={physical.weight} 
              onChange={(e) => setPhysicalData({ weight: parseFloat(e.target.value) })}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary" 
            />
          </div>
        </div>

        {/* ----- NUEVO: GÉNERO DEFINITIVO ----- */}
        <div className="flex flex-col gap-3">
          <label className="text-base font-semibold text-foreground">{t("step1.gender", "Género Biológico")}</label>
          <div className="flex gap-3">
            <button 
              onClick={() => setPhysicalData({ gender: 'MALE' })}
              className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${physical.gender === 'MALE' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
            >
              {t("step1.male", "Hombre")}
            </button>
            <button 
              onClick={() => setPhysicalData({ gender: 'FEMALE' })}
              className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${physical.gender === 'FEMALE' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
            >
              {t("step1.female", "Mujer")}
            </button>
          </div>
        </div>

        {/* ----- NUEVO: NIVEL DE ACTIVIDAD DEFINITIVO ----- */}
        <div className="flex flex-col gap-3">
          <label className="text-base font-semibold text-foreground">{t("step1.activityLevel", "Nivel de Actividad Física")}</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {activityOptions.map((level) => (
              <button 
                key={level}
                onClick={() => setPhysicalData({ activityLevel: level })}
                className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-center text-center h-16 ${physical.activityLevel === level ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
              >
                {t(`step1.activity.${level}`, level.replace('_', ' '))}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Action Button */}
      <div className="mt-8 flex flex-col items-center">
        <Button onClick={handleNext} className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-xl text-lg shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 flex items-center justify-center gap-2">
          {t("step1.next", "Siguiente Paso")}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </Button>
      </div>

    </div>
  );
};