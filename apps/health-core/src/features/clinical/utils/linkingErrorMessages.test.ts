import { describe, expect, it } from 'vitest';

import {
  getNutritionistUnlinkErrorMessage,
  getPatientLinkingErrorMessage,
} from './linkingErrorMessages';

const t = (key: string) => key;

describe('linkingErrorMessages', () => {
  it('hides technical backend messages for patient unlink 503 responses', () => {
    const message = getPatientLinkingErrorMessage(
      {
        response: {
          status: 503,
          data: { message: 'No fue posible cancelar las citas futuras antes de desvincular' },
        },
      },
      t,
      'unlink',
    );

    expect(message).toBe('linking.unlinkUnavailable');
  });

  it('maps patient link conflicts to the existing unlink-first guidance', () => {
    const message = getPatientLinkingErrorMessage({ response: { status: 409 } }, t, 'link');

    expect(message).toBe('linking.unlinkFirst');
  });

  it('hides technical backend messages for nutritionist unlink 503 responses', () => {
    const message = getNutritionistUnlinkErrorMessage(
      {
        response: {
          status: 503,
          data: { message: 'Agenda service unavailable' },
        },
      },
      t,
    );

    expect(message).toBe('patients.file.unlinkUnavailable');
  });
});
