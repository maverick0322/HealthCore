import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BarcodeScanner from 'react-qr-barcode-scanner-18';

interface QrScannerProps {
  onScan: (data: string) => void;
  isScanning: boolean;
}

const extractScannerText = (result: unknown): string | null => {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const resultWithText = result as { text?: unknown; getText?: () => unknown };
  if (typeof resultWithText.text === 'string') {
    return resultWithText.text;
  }

  if (typeof resultWithText.getText === 'function') {
    const text = resultWithText.getText();
    return typeof text === 'string' ? text : null;
  }

  return null;
};

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

export const QrScanner = ({ onScan, isScanning }: QrScannerProps) => {
  const { t } = useTranslation('patient');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stopStream, setStopStream] = useState(false);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    hasScannedRef.current = false;
    setStopStream(!isScanning);
    setHasPermission(null);
    if (!isScanning) {
      setError(null);
    }
  }, [isScanning]);

  if (!isScanning) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black/5 border-2 border-dashed border-muted-foreground/20">
      {hasPermission === false ? (
        <div className="m-4 p-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/20">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">
              {t('linking.cameraError')}
            </p>
            {error && <p className="text-xs mt-1 opacity-70">{error}</p>}
          </div>
        </div>
      ) : (
        <div className="aspect-square relative flex items-center justify-center bg-black overflow-hidden">
          <BarcodeScanner
            width="100%"
            height="100%"
            facingMode="environment"
            delay={250}
            stopStream={stopStream}
            videoConstraints={{
              facingMode: { ideal: 'environment' },
            }}
            onError={(scannerError: { message?: string } | undefined) => {
              setHasPermission(false);
              setError(scannerError?.message ?? 'Camera access denied');
              if (import.meta.env.DEV) {
                console.error('QR Scanner Error:', scannerError);
              }
            }}
            onUpdate={(scannerError: unknown, result: unknown) => {
              if (scannerError) {
                return;
              }

              setHasPermission(true);
              setError(null);

              if (hasScannedRef.current) {
                return;
              }

              const rawText = extractScannerText(result);
              if (!rawText) {
                return;
              }

              const linkingCode = normalizeLinkingCode(rawText);
              if (!linkingCode) {
                return;
              }

              hasScannedRef.current = true;
              setStopStream(true);
              setTimeout(() => onScan(linkingCode), 0);
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
            <div className="w-full h-full border-2 border-primary shadow-[0_0_0_999px_rgba(0,0,0,0.5)] rounded-lg"></div>
          </div>
        </div>
      )}
    </div>
  );
};
