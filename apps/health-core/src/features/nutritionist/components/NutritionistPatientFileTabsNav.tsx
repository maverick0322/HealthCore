import { useTranslation } from 'react-i18next';

export type NutritionistPatientFileTab = 'overview' | 'plan' | 'history' | 'observations';

interface NutritionistPatientFileTabsNavProps {
  activeTab: NutritionistPatientFileTab;
  onChangeTab: (tab: NutritionistPatientFileTab) => void;
}

const TAB_LABEL_KEYS: Record<NutritionistPatientFileTab, string> = {
  overview: 'patients.file.tabOverview',
  plan: 'patients.file.tabPlan',
  history: 'patients.file.tabHistory',
  observations: 'patients.file.tabObservations',
};

export function NutritionistPatientFileTabsNav({
  activeTab,
  onChangeTab,
}: Readonly<NutritionistPatientFileTabsNavProps>) {
  const { t } = useTranslation('nutritionist');

  return (
    <div className="flex items-center gap-6 mt-8 overflow-x-auto hide-scrollbar border-b border-border/50 pb-px">
      {(Object.keys(TAB_LABEL_KEYS) as NutritionistPatientFileTab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => onChangeTab(tab)}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
            activeTab === tab
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t(TAB_LABEL_KEYS[tab])}
        </button>
      ))}
    </div>
  );
}
