import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NutritionistGenerateQrPage } from './NutritionistGenerateQrPage';
import { clinicalApi } from '@/features/clinical/services/clinicalService';

vi.mock('@/features/clinical/services/clinicalService');
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

vi.mock('react-qr-code', () => ({
  default: () => null
}));

describe('NutritionistGenerateQrPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('must load the active code from the API and display it in the interface', async () => {
    (clinicalApi.getCurrentLinkingCode as any).mockResolvedValue({
      code: 'CODIGO_VIVO',
      expiresInSeconds: 900
    });

    render(<NutritionistGenerateQrPage />);

    await waitFor(() => {
      expect(screen.getByText('CODIGO_VIVO')).toBeInTheDocument();
      expect(screen.getByText('linking.title')).toBeInTheDocument();
    });
  });

  it('must generate a new code if the API responds that there are no active codes', async () => {
    (clinicalApi.getCurrentLinkingCode as any).mockResolvedValue(null);
    (clinicalApi.generateLinkingCode as any).mockResolvedValue({
      code: 'NUEVO_CODIGO',
      expiresInSeconds: 900
    });

    render(<NutritionistGenerateQrPage />);

    await waitFor(() => {
      expect(clinicalApi.generateLinkingCode).toHaveBeenCalledTimes(1);
      expect(screen.getByText('NUEVO_CODIGO')).toBeInTheDocument();
    });
  });

  it('must prompt regeneration when the current code expires on screen', async () => {
    (clinicalApi.getCurrentLinkingCode as any).mockResolvedValue({
      code: 'CODIGO_CORTO',
      expiresInSeconds: 1
    });
    (clinicalApi.generateLinkingCode as any).mockResolvedValue({
      code: 'CODIGO_NUEVO',
      expiresInSeconds: 900
    });

    render(<NutritionistGenerateQrPage />);

    await waitFor(() => {
      expect(screen.getByText('CODIGO_CORTO')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByText('linking.expiredTitle').length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    fireEvent.click(screen.getAllByText('linking.generateNewBtn')[0]);

    await waitFor(() => {
      expect(clinicalApi.generateLinkingCode).toHaveBeenCalledTimes(1);
      expect(screen.getByText('CODIGO_NUEVO')).toBeInTheDocument();
    });
  });
});
