import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const decodeFromConstraints = vi.fn();

vi.mock('@zxing/library/esm/browser/BrowserMultiFormatReader.js', () => ({
  BrowserMultiFormatReader: class {
    timeBetweenDecodingAttempts = 0;
    decodeFromConstraints = decodeFromConstraints;
    reset = vi.fn();
  },
}));

vi.mock('@zxing/library/esm/core/DecodeHintType.js', () => ({
  default: {
    POSSIBLE_FORMATS: 'POSSIBLE_FORMATS',
  },
}));

vi.mock('@zxing/library/esm/core/BarcodeFormat.js', () => ({
  default: {
    QR_CODE: 'QR_CODE',
  },
}));

class MockNotFoundError extends Error {}
class MockChecksumError extends Error {}
class MockFormatError extends Error {}

vi.mock('@zxing/library/esm/core/NotFoundException.js', () => ({
  default: MockNotFoundError,
}));

vi.mock('@zxing/library/esm/core/ChecksumException.js', () => ({
  default: MockChecksumError,
}));

vi.mock('@zxing/library/esm/core/FormatException.js', () => ({
  default: MockFormatError,
}));

import { QrScanner } from './QrScanner';

describe('QrScanner', () => {
  const getUserMedia = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia,
      },
    });

    getUserMedia.mockResolvedValue({});
  });

  it('should not render anything if isScanning is false', () => {
    const { container } = render(<QrScanner isScanning={false} onScan={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('should scan a QR code and notify the parent when detection succeeds', async () => {
    const mockOnScan = vi.fn();
    decodeFromConstraints.mockImplementation(async (_constraints: unknown, _video: unknown, callback: (result: { getText: () => string } | null, error: unknown) => void) => {
      callback({ getText: () => 'AB12CD' }, null);
    });

    render(<QrScanner isScanning={true} onScan={mockOnScan} />);

    await waitFor(() => {
      expect(mockOnScan).toHaveBeenCalledWith('AB12CD');
    }, { timeout: 1500 });
  });

  it('should show a friendly camera error when camera access is unavailable', async () => {
    decodeFromConstraints.mockRejectedValue(new Error('Permission denied'));

    render(<QrScanner isScanning={true} onScan={vi.fn()} />);

    expect(await screen.findByText('linking.cameraError')).toBeInTheDocument();
  });

  it('should show a friendly camera error when the browser does not support scanning', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    });

    render(<QrScanner isScanning={true} onScan={vi.fn()} />);

    expect(await screen.findByText('linking.cameraError')).toBeInTheDocument();
  });
});
