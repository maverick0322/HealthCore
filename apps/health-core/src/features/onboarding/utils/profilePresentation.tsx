import type { TFunction } from 'i18next';
import type { LucideIcon } from 'lucide-react';
import {
  Accessibility,
  ArrowDown,
  Baby,
  Bike,
  Building2,
  Dumbbell,
  Egg,
  Fish,
  FlaskConical,
  Footprints,
  HeartPulse,
  House,
  Mars,
  Milk,
  MonitorSmartphone,
  MoonStar,
  NutOff,
  ShieldCheck,
  Stethoscope,
  Trophy,
  User,
  Venus,
  Wheat,
} from 'lucide-react';

import type {
  ActivityLevel,
  Allergy,
  ConsultationType,
  DietType,
  Gender,
  NutritionistSpecialization,
  PatientGoal,
} from '@/features/clinical/types/clinical.types';

export interface OptionMetadata<T extends string> {
  value: T;
  labelKey: string;
  descriptionKey?: string;
  icon?: LucideIcon;
}

export const genderOptions: OptionMetadata<Gender>[] = [
  { value: 'MALE', labelKey: 'onboarding:options.gender.MALE.label', icon: Mars },
  { value: 'FEMALE', labelKey: 'onboarding:options.gender.FEMALE.label', icon: Venus },
];

export const activityLevelOptions: OptionMetadata<ActivityLevel>[] = [
  {
    value: 'SEDENTARY',
    labelKey: 'onboarding:options.activityLevels.SEDENTARY.label',
    descriptionKey: 'onboarding:options.activityLevels.SEDENTARY.description',
    icon: MoonStar,
  },
  {
    value: 'LIGHTLY_ACTIVE',
    labelKey: 'onboarding:options.activityLevels.LIGHTLY_ACTIVE.label',
    descriptionKey: 'onboarding:options.activityLevels.LIGHTLY_ACTIVE.description',
    icon: Bike,
  },
  {
    value: 'MODERATELY_ACTIVE',
    labelKey: 'onboarding:options.activityLevels.MODERATELY_ACTIVE.label',
    descriptionKey: 'onboarding:options.activityLevels.MODERATELY_ACTIVE.description',
    icon: Dumbbell,
  },
  {
    value: 'VERY_ACTIVE',
    labelKey: 'onboarding:options.activityLevels.VERY_ACTIVE.label',
    descriptionKey: 'onboarding:options.activityLevels.VERY_ACTIVE.description',
    icon: HeartPulse,
  },
  {
    value: 'EXTRA_ACTIVE',
    labelKey: 'onboarding:options.activityLevels.EXTRA_ACTIVE.label',
    descriptionKey: 'onboarding:options.activityLevels.EXTRA_ACTIVE.description',
    icon: Trophy,
  },
];

export const patientGoalOptions: OptionMetadata<PatientGoal>[] = [
  {
    value: 'weight-loss',
    labelKey: 'onboarding:options.goals.weight-loss.label',
    descriptionKey: 'onboarding:options.goals.weight-loss.description',
    icon: ArrowDown,
  },
  {
    value: 'muscle-gain',
    labelKey: 'onboarding:options.goals.muscle-gain.label',
    descriptionKey: 'onboarding:options.goals.muscle-gain.description',
    icon: Dumbbell,
  },
  {
    value: 'health',
    labelKey: 'onboarding:options.goals.health.label',
    descriptionKey: 'onboarding:options.goals.health.description',
    icon: HeartPulse,
  },
  {
    value: 'performance',
    labelKey: 'onboarding:options.goals.performance.label',
    descriptionKey: 'onboarding:options.goals.performance.description',
    icon: Footprints,
  },
];

export const dietOptions: OptionMetadata<DietType>[] = [
  { value: 'omnivore', labelKey: 'onboarding:options.diets.omnivore.label' },
  { value: 'vegetarian', labelKey: 'onboarding:options.diets.vegetarian.label' },
  { value: 'vegan', labelKey: 'onboarding:options.diets.vegan.label' },
  { value: 'keto', labelKey: 'onboarding:options.diets.keto.label' },
  { value: 'paleo', labelKey: 'onboarding:options.diets.paleo.label' },
];

export const allergyOptions: OptionMetadata<Allergy>[] = [
  { value: 'gluten', labelKey: 'onboarding:options.allergies.gluten.label', icon: Wheat },
  { value: 'lactose', labelKey: 'onboarding:options.allergies.lactose.label', icon: Milk },
  { value: 'nuts', labelKey: 'onboarding:options.allergies.nuts.label', icon: NutOff },
  { value: 'seafood', labelKey: 'onboarding:options.allergies.seafood.label', icon: Fish },
  { value: 'egg', labelKey: 'onboarding:options.allergies.egg.label', icon: Egg },
];

export const nutritionistSpecializationOptions: OptionMetadata<NutritionistSpecialization>[] = [
  { value: 'CLINICAL', labelKey: 'onboarding:options.specializations.CLINICAL.label', icon: Stethoscope },
  { value: 'SPORTS', labelKey: 'onboarding:options.specializations.SPORTS.label', icon: Dumbbell },
  { value: 'PEDIATRIC', labelKey: 'onboarding:options.specializations.PEDIATRIC.label', icon: Baby },
  { value: 'GERIATRIC', labelKey: 'onboarding:options.specializations.GERIATRIC.label', icon: Accessibility },
  {
    value: 'FOOD_SAFETY',
    labelKey: 'onboarding:options.specializations.FOOD_SAFETY.label',
    icon: ShieldCheck,
  },
  { value: 'PERINATAL', labelKey: 'onboarding:options.specializations.PERINATAL.label', icon: HeartPulse },
  {
    value: 'FOOD_TECHNOLOGY',
    labelKey: 'onboarding:options.specializations.FOOD_TECHNOLOGY.label',
    icon: FlaskConical,
  },
  { value: 'OTHER', labelKey: 'onboarding:options.specializations.OTHER.label', icon: User },
];

export const consultationTypeOptions: OptionMetadata<ConsultationType>[] = [
  { value: 'PRESENTIAL', labelKey: 'onboarding:options.consultationTypes.PRESENTIAL.label', icon: Building2 },
  { value: 'ONLINE', labelKey: 'onboarding:options.consultationTypes.ONLINE.label', icon: MonitorSmartphone },
  { value: 'HOME_VISIT', labelKey: 'onboarding:options.consultationTypes.HOME_VISIT.label', icon: House },
];

const legacyNutritionistSpecializationLabelKeys: Record<string, string> = {
  WOMENS_HEALTH: 'onboarding:options.legacySpecializations.WOMENS_HEALTH.label',
  GASTROINTESTINAL: 'onboarding:options.legacySpecializations.GASTROINTESTINAL.label',
  METABOLIC: 'onboarding:options.legacySpecializations.METABOLIC.label',
  RENAL: 'onboarding:options.legacySpecializations.RENAL.label',
};

const translateLabel = <T extends string>(
  t: TFunction,
  value: T | string | null | undefined,
  options: OptionMetadata<T>[],
  fallback = '--'
) => {
  if (!value) {
    return fallback;
  }

  const match = options.find((option) => option.value === value);
  if (match) {
    return t(match.labelKey);
  }

  const legacyKey = legacyNutritionistSpecializationLabelKeys[value];
  return legacyKey ? t(legacyKey) : value;
};

export const getGenderMetadata = (value: Gender | string | null | undefined) =>
  genderOptions.find((option) => option.value === value);

export const getActivityLevelMetadata = (value: ActivityLevel | string | null | undefined) =>
  activityLevelOptions.find((option) => option.value === value);

export const getPatientGoalMetadata = (value: PatientGoal | string | null | undefined) =>
  patientGoalOptions.find((option) => option.value === value);

export const getDietMetadata = (value: DietType | string | null | undefined) =>
  dietOptions.find((option) => option.value === value);

export const getAllergyMetadata = (value: Allergy | string | null | undefined) =>
  allergyOptions.find((option) => option.value === value);

export const getNutritionistSpecializationMetadata = (
  value: NutritionistSpecialization | string | null | undefined
) => nutritionistSpecializationOptions.find((option) => option.value === value);

export const getConsultationTypeMetadata = (
  value: ConsultationType | string | null | undefined
) => consultationTypeOptions.find((option) => option.value === value);

export const getOptionLabel = <T extends string>(t: TFunction, option: OptionMetadata<T>) => t(option.labelKey);

export const getOptionDescription = <T extends string>(t: TFunction, option: OptionMetadata<T>) =>
  option.descriptionKey ? t(option.descriptionKey) : undefined;

export const formatGenderLabel = (t: TFunction, value: Gender | string | null | undefined): string =>
  translateLabel(t, value, genderOptions);

export const formatActivityLevelLabel = (
  t: TFunction,
  value: ActivityLevel | string | null | undefined,
  includeDescription = false
): string => {
  const metadata = getActivityLevelMetadata(value);
  if (!metadata) {
    return value ?? '--';
  }

  const label = t(metadata.labelKey);
  const description = metadata.descriptionKey ? t(metadata.descriptionKey) : undefined;

  if (!includeDescription || !description) {
    return label;
  }

  return `${label} (${description})`;
};

export const formatPatientGoalLabel = (t: TFunction, value: PatientGoal | string | null | undefined): string =>
  translateLabel(t, value, patientGoalOptions);

export const formatDietLabel = (t: TFunction, value: DietType | string | null | undefined): string =>
  translateLabel(t, value, dietOptions);

export const formatAllergyLabel = (t: TFunction, value: Allergy | string | null | undefined): string =>
  translateLabel(t, value, allergyOptions);

export const formatNutritionistSpecializationLabel = (
  t: TFunction,
  value: NutritionistSpecialization | string | null | undefined
): string => translateLabel(t, value, nutritionistSpecializationOptions);

export const formatConsultationTypeLabel = (
  t: TFunction,
  value: ConsultationType | string | null | undefined
): string => translateLabel(t, value, consultationTypeOptions);

export const formatIsoDateToDisplay = (isoDate: string | null | undefined): string => {
  if (!isoDate) {
    return '--';
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

export const normalizeDateInput = (value: string): string =>
  value
    .replaceAll(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{2})(\d{0,2})(\d{0,4})/, (_, day, month, year) =>
      [day, month, year].filter(Boolean).join('/')
    );

export const parseDisplayDateToIso = (value: string): string | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const isoDate = `${year}-${month}-${day}`;
  const parsedDate = new Date(`${isoDate}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const isSameDate =
    parsedDate.getUTCFullYear() === Number(year) &&
    parsedDate.getUTCMonth() + 1 === Number(month) &&
    parsedDate.getUTCDate() === Number(day);

  return isSameDate ? isoDate : null;
};
