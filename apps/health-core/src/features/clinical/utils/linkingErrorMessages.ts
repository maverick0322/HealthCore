import axios from 'axios';

type Translate = (key: string) => string;

const getStatus = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.status ?? null;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { status?: unknown } }).response?.status === 'number'
  ) {
    return (error as { response: { status: number } }).response.status;
  }

  return null;
};

export const getPatientLinkingErrorMessage = (
  error: unknown,
  t: Translate,
  action: 'link' | 'unlink',
) => {
  const status = getStatus(error);

  if (action === 'unlink') {
    if (status === 503) {
      return t('linking.unlinkUnavailable');
    }
    if (status === 404) {
      return t('linking.unlinkAlreadyDone');
    }
    return t('linking.unlinkError');
  }

  if (status === 409) {
    return t('linking.unlinkFirst');
  }
  if (status === 400 || status === 404) {
    return t('linking.error');
  }
  if (status === 503) {
    return t('linking.linkUnavailable');
  }

  return t('linking.linkError');
};

export const getNutritionistUnlinkErrorMessage = (error: unknown, t: Translate) => {
  const status = getStatus(error);

  if (status === 503) {
    return t('patients.file.unlinkUnavailable');
  }
  if (status === 403) {
    return t('patients.file.unlinkForbidden');
  }
  if (status === 404) {
    return t('patients.file.unlinkNotFound');
  }

  return t('patients.file.unlinkError');
};
