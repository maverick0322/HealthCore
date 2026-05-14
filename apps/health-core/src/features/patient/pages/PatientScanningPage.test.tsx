import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/clinical/services/clinicalService');
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
vi.mock('react-i18next', () => ({ 
  useTranslation: () => ({ t: (key: string) => key }) 
}));

vi.mock('@/shared/components/QrScanner', () => ({
  QrScanner: () => <div data-testid="mock-scanner">Scanner Dummy</div>
}));

vi.mock('@/features/onboarding/hooks/useProfileGuard', () => ({
  useProfileGuard: () => ({ hasProfile: true, isLoading: false })
}));

import { PatientScanningPage } from './PatientScanningPage';
import { clinicalApi } from '@/features/clinical/services/clinicalService';

describe('PatientScanningPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (clinicalApi.isPatientLinked as any).mockResolvedValue(false);
  });

  it('should display validation error if code does not have 6 characters', async () => {
    render(<PatientScanningPage />);
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('linking.inputPlaceholder');
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('linking.inputPlaceholder');
    fireEvent.change(input, { target: { value: 'SHORT' } });
    
    const btn = screen.getByText('linking.connectButton');
    expect(btn).toBeDisabled();
  });

  it('should call API and redirect on valid code submission', async () => {
    (clinicalApi.linkPatient as any).mockResolvedValue({});
    
    render(<PatientScanningPage />);
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('linking.inputPlaceholder');
      fireEvent.change(input, { target: { value: 'AB12CD' } });
    });

    const btn = screen.getByText('linking.connectButton');
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);

    await waitFor(() => {
      expect(clinicalApi.linkPatient).toHaveBeenCalledWith({ code: 'AB12CD' });
    });
    
    await new Promise((r) => setTimeout(r, 2100));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('should handle 409 error when patient is already linked to another nutritionist', async () => {
    const conflictError = {
      response: {
        status: 409,
        data: {
          message: 'Patient is already linked to another nutritionist',
          currentNutritionistId: 'nutri-999'
        }
      }
    };
    (clinicalApi.linkPatient as any).mockRejectedValue(conflictError);
    
    render(<PatientScanningPage />);
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('linking.inputPlaceholder');
      fireEvent.change(input, { target: { value: 'AB12CD' } });
    });

    const btn = screen.getByText('linking.connectButton');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText('linking.unlinkFirst')).toBeInTheDocument();
    });
  });

  it('should show unlink button when patient is already linked', async () => {
    (clinicalApi.isPatientLinked as any).mockResolvedValue(true);
    
    render(<PatientScanningPage />);
    
    await waitFor(() => {
      expect(screen.getByText('linking.unlink')).toBeInTheDocument();
    });
  });

  it('should unlink patient and redirect to profile', async () => {
    (clinicalApi.isPatientLinked as any).mockResolvedValue(true);
    (clinicalApi.unlinkPatient as any).mockResolvedValue({});
    
    render(<PatientScanningPage />);
    
    await waitFor(() => {
      const unlinkBtns = screen.getAllByText('linking.unlink');
      expect(unlinkBtns.length).toBeGreaterThan(0);
      fireEvent.click(unlinkBtns[0]); // Click first unlink button
    });

    // Confirm dialog
    await waitFor(() => {
      const confirmBtns = screen.getAllByText('linking.unlink');
      expect(confirmBtns.length).toBeGreaterThan(1); // Should have button + dialog button
      fireEvent.click(confirmBtns[1]); // Click second unlink button (in dialog)
    });

    await waitFor(() => {
      expect(clinicalApi.unlinkPatient).toHaveBeenCalled();
    });

    await new Promise((r) => setTimeout(r, 2100));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });
});