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
              <div className="w-8 h-8 hidden sm:flex items-center justify-center bg-primary/10 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4-12H8v8h8V8z"/></svg>
              </div>
              <h2 className="text-foreground text-lg sm:text-xl font-bold leading-tight tracking-tight">HealthCore</h2>
            </div>

            <div className="flex justify-end items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex min-w-[84px] items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-primary/10 text-primary text-xs font-bold leading-normal">
                <span>{t('stepper.step', { current: currentStep, total: totalSteps })}</span>
              </div>

              <SettingsBar className="flex items-center gap-2" />

              <div className="flex bg-muted bg-center bg-no-repeat aspect-square bg-cover rounded-full w-9 h-9 sm:w-10 sm:h-10 border-2 border-primary/20 items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
              </div>
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
