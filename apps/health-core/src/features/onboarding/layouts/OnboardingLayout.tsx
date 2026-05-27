import { useTranslation } from 'react-i18next';
import { SettingsBar } from '@/shared/components/SettingsBar';

interface OnboardingLayoutProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

export const OnboardingLayout = ({
  currentStep,
  totalSteps,
  children,
}: OnboardingLayoutProps) => {
  const { t } = useTranslation('onboarding');

  return (
    <div className="bg-background text-foreground min-h-screen font-sans flex flex-col relative transition-colors duration-500 ease-in-out">
      <div className="relative flex min-h-[100dvh] w-full flex-col group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <header className="flex items-center justify-between whitespace-nowrap border-b border-border bg-card px-4 md:px-10 py-3 sticky top-0 z-50 transition-colors">
            <div className="flex items-center gap-3 text-primary">
              <div className="w-8 h-8 hidden sm:flex items-center justify-center bg-primary/10 rounded-lg overflow-hidden">
                <img src="/icon-192.png" alt="HealthCore" className="h-5 w-5" />
              </div>
              <h2 className="text-foreground text-lg sm:text-xl font-bold leading-tight tracking-tight">HealthCore</h2>
            </div>

            <div className="flex justify-end items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex min-w-[84px] items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-primary/10 text-primary text-xs font-bold leading-normal">
                <span>{t('stepper.step', { current: currentStep, total: totalSteps })}</span>
              </div>
              <SettingsBar className="flex items-center gap-2" />
            </div>
          </header>

          <main className="flex flex-1 justify-center py-10 px-4 md:px-0">
            <div className="flex flex-col max-w-[560px] flex-1">
              <div className="w-full bg-secondary h-1.5 rounded-full mb-8 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>

              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
