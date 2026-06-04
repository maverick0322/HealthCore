import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

interface QrScannerProps {
  readonly onScan: (data: string) => void;
  readonly isScanning: boolean;
}

const SCAN_INTERVAL_MS = 300;

interface ScanResultLike {
  getText?: () => string;
  text?: string;
}

const isScanResultLike = (result: unknown): result is ScanResultLike =>
  typeof result === 'object' && result !== null;

interface BrowserMultiFormatReaderLike {
  timeBetweenDecodingAttempts: number;
  decodeFromConstraints: (
    constraints: MediaStreamConstraints,
    videoSource: HTMLVideoElement | string,
    callback: (result: unknown, error: unknown) => void
  ) => Promise<void>;
  reset: () => void;
}

const normalizeLinkingCode = (rawValue: string): string | null => {
  const normalized = rawValue.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  const exactMatch = normalized.match(/^[A-Z0-9]{6}$/);
  if (exactMatch) {
    return exactMatch[0];
  }

  const embeddedMatch = normalized.match(/[A-Z0-9]{6}/);
  return embeddedMatch ? embeddedMatch[0] : null;
};

export const QrScanner = ({ onScan, isScanning }: Readonly<QrScannerProps>) => {
  const { t } = useTranslation('patient');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showCameraError, setShowCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReaderLike | null>(null);
  const hasScannedRef = useRef(false);

  const extractScannerText = (result: unknown): string | null => {
    if (!isScanResultLike(result)) {
      return null;
    }

    if (typeof result.getText === 'function') {
      const text = result.getText();
      return typeof text === 'string' ? text : null;
    }

    if (typeof result.text === 'string') {
      return result.text;
    }

    return null;
  };

  useEffect(() => {
    const stopScanner = () => {
      readerRef.current?.reset();
      readerRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    if (!isScanning) {
      stopScanner();
      hasScannedRef.current = false;
      setHasPermission(null);
      setShowCameraError(false);
      setIsInitializing(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setHasPermission(false);
      setShowCameraError(true);
      setIsInitializing(false);
      return stopScanner;
    }

    let cancelled = false;
    hasScannedRef.current = false;
    setIsInitializing(true);
    setShowCameraError(false);

    const startScanner = async () => {
      try {
        if (!videoRef.current) {
          throw new Error('Camera preview is not available');
        }

        const [
          browserReaderModule,
          decodeHintTypeModule,
          barcodeFormatModule,
          notFoundExceptionModule,
          checksumExceptionModule,
          formatExceptionModule,
        ] = await Promise.all([
          import('@zxing/library/esm/browser/BrowserMultiFormatReader.js'),
          import('@zxing/library/esm/core/DecodeHintType.js'),
          import('@zxing/library/esm/core/BarcodeFormat.js'),
          import('@zxing/library/esm/core/NotFoundException.js'),
          import('@zxing/library/esm/core/ChecksumException.js'),
          import('@zxing/library/esm/core/FormatException.js'),
        ]);

        if (cancelled) {
          return;
        }

        const hints = new Map();
        hints.set(decodeHintTypeModule.default.POSSIBLE_FORMATS, [barcodeFormatModule.default.QR_CODE]);

        const reader = new browserReaderModule.BrowserMultiFormatReader(hints, SCAN_INTERVAL_MS);
        reader.timeBetweenDecodingAttempts = SCAN_INTERVAL_MS;
        readerRef.current = reader;

        setHasPermission(true);
        setIsInitializing(false);

        await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: 'environment' },
            },
            audio: false,
          },
          videoRef.current,
          (result, error) => {
            if (cancelled || hasScannedRef.current) {
              return;
            }

            if (result) {
              const rawValue = extractScannerText(result);
              if (!rawValue) {
                return;
              }

              const linkingCode = normalizeLinkingCode(rawValue);
              if (!linkingCode) {
                return;
              }

              hasScannedRef.current = true;
              stopScanner();
              onScan(linkingCode);
              return;
            }

            if (
              error instanceof notFoundExceptionModule.default ||
              error instanceof checksumExceptionModule.default ||
              error instanceof formatExceptionModule.default
            ) {
              return;
            }

            if (import.meta.env.DEV) {
              console.error('QR detector error', error);
            }
          }
        );
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Unable to start camera scanner', error);
        }

        if (!cancelled) {
          setHasPermission(false);
          setShowCameraError(true);
          setIsInitializing(false);
        }
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [isScanning, onScan]);

  if (!isScanning) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black/5 border-2 border-dashed border-muted-foreground/20">
      {showCameraError ? (
        <div className="m-4 p-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/20">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{t('linking.cameraError')}</p>
          </div>
        </div>
      ) : (
        <div className="aspect-square relative flex items-center justify-center bg-black overflow-hidden">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />
          {isInitializing || hasPermission === null ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <LoadingSpinner />
            </div>
          ) : null}
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
            <div className="w-full h-full border-2 border-primary shadow-[0_0_0_999px_rgba(0,0,0,0.5)] rounded-lg"></div>
          </div>
        </div>
      )}
    </div>
  );
};
