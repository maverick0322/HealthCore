import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

vi.mock('react-qr-barcode-scanner-18', () => {
  return {
    default: ({ onUpdate }: any) => (
      <button
        data-testid="mock-scanner"
        onClick={() => onUpdate(null, { text: 'AB12CD' })}
      >
        Scanner
      </button>
    )
  };
});

import { QrScanner } from './QrScanner';

describe('QrScanner', () => {
  it('should not render anything if isScanning is false', () => {
    const { container } = render(<QrScanner isScanning={false} onScan={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('Must render the scanner and handle the events when isScanning is true', async () => {
    const mockOnScan = vi.fn();
    render(<QrScanner isScanning={true} onScan={mockOnScan} />);
    
    const scannerButton = screen.getByTestId('mock-scanner');
    expect(scannerButton).toBeInTheDocument();

    scannerButton.click();
    await waitFor(() => {
      expect(mockOnScan).toHaveBeenCalledWith('AB12CD');
    });
  });
});
