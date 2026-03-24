import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { usePatientOnboardingStore } from "../store/usePatientOnboardingStore";

export const Step4Summary = () => {
  const { t } = useTranslation("onboarding");
  const { physical, goal, preferences, setStep } = usePatientOnboardingStore();

  const handleFinish = () => {
    // In the future this will submit to backend, then redirect
    console.log("Submitting Onboarding Data: ", { physical, goal, preferences });
  };

  return (
    <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center">
      
      {/* Intro Section */}
      <div className="flex flex-col gap-3 text-center mb-10 w-full">
        <h1 className="text-foreground text-3xl md:text-4xl font-black leading-tight tracking-tight">
          {t("step4.title")}
        </h1>
        <p className="text-muted-foreground text-base font-normal leading-relaxed">
          {t("step4.subtitle")}
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-card w-full rounded-xl border border-border shadow-sm overflow-hidden mb-8 transition-colors">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Section 1: Physical */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" ry="2"/><line x1="6" y1="6" x2="6" y2="9"/><line x1="10" y1="6" x2="10" y2="12"/><line x1="14" y1="6" x2="14" y2="9"/><line x1="18" y1="6" x2="18" y2="12"/></svg>
            </div>
            <div className="flex flex-col grow">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{t("step4.physicalData")}</p>
              <p className="text-foreground text-lg font-semibold mt-1">
                {physical.age} años, {physical.height}cm, {physical.weight}kg
              </p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
          </div>

          <div className="h-px bg-border w-full"></div>

          {/* Section 2: Goal */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11.47 17.59-.51.52a5.57 5.57 0 0 1-7.88-7.89l.52-.51"/><path d="m20.53 14.88-.51.52a5.57 5.57 0 0 1-7.88-7.89l.52-.51"/><path d="m14.6 20.17 3.41-3.41"/><path d="m5.83 9.4 3.41-3.41"/><path d="m12.18 18.06 6.07-6.06"/><path d="m5.87 11.83 6.06-6.07"/><path d="m8.55 14.54 6.91-6.91"/></svg>
            </div>
            <div className="flex flex-col grow">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{t("step4.mainGoal")}</p>
              <p className="text-foreground text-lg font-semibold mt-1">
                {/* Dynamically translating the goal enum directly since the i18n key matches */}
                {t(`step2.goals.${
                  goal === "weight-loss" ? "weightLoss" : 
                  goal === "muscle-gain" ? "muscleGain" : 
                  goal === "health" ? "health" : "performance"
                }.title`)}
              </p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
          </div>

          <div className="h-px bg-border w-full"></div>

          {/* Section 3: Preferences */}
          <div className="flex items-start gap-4">
             <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
            </div>
            <div className="flex flex-col grow">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{t("step4.preferences")}</p>
              <p className="text-foreground text-lg font-semibold mt-1">
                Dieta {t(`step3.diets.${preferences.dietType}`)}
                {preferences.allergies.length > 0 
                  ? `, Evitar: ${preferences.allergies.map(a => t(`step3.allergyItems.${a}`)).join(', ')}` 
                  : ', Sin Alergias'}
              </p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-4 w-full">
        <Button 
          onClick={handleFinish} 
          className="w-full flex items-center justify-center h-14 bg-primary text-primary-foreground text-lg font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          {t("step4.finishBtn")}
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => setStep(1)} 
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors hover:bg-transparent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          <span>{t("step4.editBtn")}</span>
        </Button>
      </div>

      {/* Trust Badge */}
      <div className="mt-12 flex justify-center items-center gap-2 text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <p className="text-xs font-medium">{t("step4.secure")}</p>
      </div>
    
    </div>
  );
};
