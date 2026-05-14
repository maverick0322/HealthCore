import type { TFunction } from 'i18next';

const NAME_PATTERN = /^[A-Za-zÀ-ÿ]+(?:[A-Za-zÀ-ÿ' -]*[A-Za-zÀ-ÿ])?$/;

const getValidationMessage = (
  t: TFunction | undefined,
  key: 'required' | 'maxLength' | 'namePattern' | 'birthDateRequired' | 'birthDateInvalid' | 'birthDateOutOfRange',
  options?: Record<string, string | number>
) => {
  if (!t) {
    switch (key) {
      case 'required':
        return `${options?.label} es obligatorio.`;
      case 'maxLength':
        return `${options?.label} no puede exceder ${options?.max} caracteres.`;
      case 'namePattern':
        return `${options?.label} solo puede contener letras, espacios, apostrofes o guiones.`;
      case 'birthDateRequired':
        return 'La fecha de nacimiento es obligatoria.';
      case 'birthDateInvalid':
        return 'La fecha de nacimiento es invalida.';
      case 'birthDateOutOfRange':
        return 'La fecha de nacimiento debe representar una edad entre 1 y 120 anos.';
    }
  }

  return t(`validation.${key}`, options);
};

export const validateRequiredName = (value: string, label: string, t?: TFunction): string | null => {
  const normalized = value.trim().replace(/\s+/g, ' ');

  if (!normalized) {
    return getValidationMessage(t, 'required', { label });
  }

  if (normalized.length > 50) {
    return getValidationMessage(t, 'maxLength', { label, max: 50 });
  }

  if (!NAME_PATTERN.test(normalized)) {
    return getValidationMessage(t, 'namePattern', { label });
  }

  return null;
};

export const validateOptionalName = (value: string, label: string, t?: TFunction): string | null => {
  if (!value.trim()) {
    return null;
  }

  return validateRequiredName(value, label, t);
};

export const normalizeText = (value: string): string => value.trim().replace(/\s+/g, ' ');

export const calculateAgeFromBirthDate = (birthDate: string): number | null => {
  if (!birthDate) {
    return null;
  }

  const parsedBirthDate = new Date(birthDate);
  if (Number.isNaN(parsedBirthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - parsedBirthDate.getFullYear();
  const monthDiff = today.getMonth() - parsedBirthDate.getMonth();
  const dayDiff = today.getDate() - parsedBirthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
};

export const validateBirthDate = (birthDate: string, t?: TFunction): string | null => {
  if (!birthDate) {
    return getValidationMessage(t, 'birthDateRequired');
  }

  const age = calculateAgeFromBirthDate(birthDate);
  if (age === null) {
    return getValidationMessage(t, 'birthDateInvalid');
  }

  if (age < 1 || age > 120) {
    return getValidationMessage(t, 'birthDateOutOfRange');
  }

  return null;
};
