import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { usePatientOnboardingStore, type GoalType } from "../store/usePatientOnboardingStore";

export const Step2Goals = () => {
  const { t } = useTranslation("onboarding");
  const { goal, setGoal, nextStep } = usePatientOnboardingStore();

  const handleNext = () => nextStep();

  const goalOptions: { id: GoalType; icon: React.ReactNode; i18nKey: string }[] = [
    {
      id: "weight-loss",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m7 19 5 3 5-3"/></svg>,
      i18nKey: "goals.weightLoss",
    },
    {
      id: "muscle-gain",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11.47 17.59-.51.52a5.57 5.57 0 0 1-7.88-7.89l.52-.51"/><path d="m20.53 14.88-.51.52a5.57 5.57 0 0 1-7.88-7.89l.52-.51"/><path d="m14.6 20.17 3.41-3.41"/><path d="m5.83 9.4 3.41-3.41"/><path d="m12.18 18.06 6.07-6.06"/><path d="m5.87 11.83 6.06-6.07"/><path d="m8.55 14.54 6.91-6.91"/></svg>,
      i18nKey: "goals.muscleGain",
    },
    {
      id: "health",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
      i18nKey: "goals.health",
    },
    {
      id: "performance",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
      i18nKey: "goals.performance",
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col gap-10">
      
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-3xl font-black tracking-tight text-foreground">{t("step2.title")}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">{t("step2.subtitle")}</p>
      </div>

      {/* Grid of Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {goalOptions.map((option) => (
          <label key={option.id} className="relative group cursor-pointer flex">
            <input 
              type="radio" 
              name="goal" 
              value={option.id} 
              className="peer sr-only" 
              checked={goal === option.id}
              onChange={() => setGoal(option.id)}
            />
            <div className="h-full w-full flex flex-col items-center text-center p-6 bg-card border-2 border-transparent rounded-xl shadow-sm transition-all duration-200 peer-checked:border-primary peer-checked:ring-4 peer-checked:ring-primary/10 hover:shadow-md hover:border-border">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                {option.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">{t(`step2.${option.i18nKey}.title`)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(`step2.${option.i18nKey}.desc`)}</p>
              
              <div className="absolute top-4 right-4 opacity-0 peer-checked:opacity-100 text-primary transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Action Button */}
      <div className="mt-4 flex flex-col items-center">
        <Button 
          onClick={handleNext} 
          className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-xl text-lg shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 flex items-center justify-center gap-2"
        >
          {t("step2.continue")}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </Button>
        <p className="text-center text-muted-foreground text-sm mt-4">{t("step2.changeLater")}</p>
      </div>

    </div>
  );
};
