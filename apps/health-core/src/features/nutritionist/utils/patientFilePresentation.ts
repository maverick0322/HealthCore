export const getDisplayIdentity = (userId: string): string => {
  const normalized = userId.trim();
  return normalized || 'Paciente';
};

export const getAgeFromBirthDate = (birthDate: string): number | null => {
  if (!birthDate) {
    return null;
  }

  const today = new Date();
  const parsedBirthDate = new Date(birthDate);
  if (Number.isNaN(parsedBirthDate.getTime())) {
    return null;
  }

  let age = today.getFullYear() - parsedBirthDate.getFullYear();
  const monthDiff = today.getMonth() - parsedBirthDate.getMonth();
  const dayDiff = today.getDate() - parsedBirthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
};

export const formatHeightInMeters = (heightCm: number): string => {
  return `${(heightCm / 100).toFixed(2)} m`;
};

export const calculateBmi = (weightKg: number, heightCm: number): string => {
  return (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
};

export const formatObservationDateTime = (value: string, locale: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
