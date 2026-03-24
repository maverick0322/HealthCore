import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { usePatientOnboardingStore, type DietType } from "../store/usePatientOnboardingStore";

export const Step3Preferences = () => {
  const { t } = useTranslation("onboarding");
  const { preferences, setPreferences, toggleAllergy, addExcludedFood, removeExcludedFood, nextStep, prevStep } = usePatientOnboardingStore();
  
  const [foodInput, setFoodInput] = useState("");

  const handleNext = () => nextStep();
  const handlePrev = () => prevStep();

  const handleAddFood = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && foodInput.trim()) {
      addExcludedFood(foodInput.trim());
      setFoodInput("");
    }
  };

  const dietOptions: DietType[] = ["omnivore", "vegetarian", "vegan", "keto", "paleo"];
  
  const allergyOptions = [
    { id: "gluten", icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 22-5-5a4 4 0 0 1 0-5.6l5-5a4 4 0 0 1 5.6 0l5 5a4 4 0 0 1 0 5.6l-5 5A4 4 0 0 1 12 22Z"/></svg> },
    { id: "lactose", icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg> },
    { id: "nuts", icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 0 0 9-9c0-3.3-1.8-6.1-4.5-7.7-1.2-.7-2.7-1.3-4.5-1.3S8.7 3.6 7.5 4.3C4.8 5.9 3 8.7 3 12a9 9 0 0 0 9 9z"/><path d="M12 21V12"/></svg> },
    { id: "seafood", icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12C2 6.48 6.48 2 12 2Z"/><path d="M12 22v-6"/><path d="m15 11.5-3 3-3-3"/></svg> },
    { id: "egg", icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c4.4 0 8-5.4 8-12S16.4 2 12 2 4 4.6 4 10s3.6 12 8 12Z"/></svg> },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col gap-8">
      
      {/* Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">{t("step3.title")}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">{t("step3.subtitle")}</p>
      </div>

      {/* Diet Type */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("step3.dietType")}</h3>
        <div className="flex flex-wrap gap-3">
          {dietOptions.map(diet => (
            <button
              key={diet}
              onClick={() => setPreferences({ dietType: diet })}
              className={`px-5 py-2 rounded-xl border-2 font-medium transition-colors ${
                preferences.dietType === diet
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground hover:border-primary/50"
              }`}
            >
              {t(`step3.diets.${diet}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Allergies / Checks */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("step3.allergies")}</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {allergyOptions.map(allergy => {
            const isChecked = preferences.allergies.includes(allergy.id);
            return (
              <label key={allergy.id} className="cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="hidden peer" 
                  checked={isChecked}
                  onChange={() => toggleAllergy(allergy.id)}
                />
                <div className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center ${
                  isChecked 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}>
                  <div className="mb-2">
                    {allergy.icon}
                  </div>
                  <span className={`text-sm font-medium ${isChecked ? "text-primary" : "text-foreground"}`}>
                    {t(`step3.allergyItems.${allergy.id}`)}
                  </span>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Avoiding Foods */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("step3.avoidFoods")}</h3>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <Input 
            type="text"
            className="w-full pl-11 pr-4 py-6 bg-background border-2 border-border rounded-xl focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground transition-all h-12"
            placeholder={t("step3.avoidPlaceholder")}
            value={foodInput}
            onChange={(e) => setFoodInput(e.target.value)}
            onKeyDown={handleAddFood}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {preferences.excludedFoods.map(food => (
            <div key={food} className="inline-flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm font-medium text-foreground">
              {food} 
              <button onClick={() => removeExcludedFood(food)} className="ml-1 outline-none text-muted-foreground hover:text-destructive">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Nav */}
      <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-border pt-8">
        <Button onClick={handlePrev} variant="ghost" className="w-full sm:w-auto h-12 text-muted-foreground font-semibold hover:text-foreground">
          {t("step3.back")}
        </Button>
        <Button onClick={handleNext} className="w-full sm:w-72 h-14 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-lg">
          {t("step3.continue")}
        </Button>
      </div>
    </div>
  );
};
