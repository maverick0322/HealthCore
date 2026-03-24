import { OnboardingLayout } from "../layouts/OnboardingLayout";
import { Step1PhysicalData } from "../components/Step1PhysicalData";
import { Step2Goals } from "../components/Step2Goals";
import { Step3Preferences } from "../components/Step3Preferences";
import { Step4Summary } from "../components/Step4Summary";
import { usePatientOnboardingStore } from "../store/usePatientOnboardingStore";

export const PatientOnboardingPage = () => {
  const step = usePatientOnboardingStore((state) => state.step);

  return (
    <OnboardingLayout>
      {step === 1 && <Step1PhysicalData />}
      {step === 2 && <Step2Goals />}
      {step === 3 && <Step3Preferences />}
      {step === 4 && <Step4Summary />}
    </OnboardingLayout>
  );
};
