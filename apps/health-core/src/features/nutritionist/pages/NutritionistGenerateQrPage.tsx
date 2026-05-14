import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import QRCodeLib from "react-qr-code";
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { clinicalApi } from '@/features/clinical/services/clinicalService';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ConfirmModal } from '@/shared/components/ConfirmModal';

export const NutritionistGenerateQrPage = () => {
  const { t } = useTranslation('nutritionist');
  const navigate = useNavigate();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);

  const QRCode = (QRCodeLib as any).default ? (QRCodeLib as any).default : QRCodeLib;

  const applyLinkingCodeState = (nextCode: string, expiresInSeconds: number) => {
    const safeSeconds = Math.max(expiresInSeconds, 0);
    setCode(nextCode);
    setExpiresAt(Date.now() + safeSeconds * 1000);
    setTimeLeft(safeSeconds);
    setIsExpired(false);
  };

  const loadOrGenerateCode = async () => {
    try {
      setIsLoading(true);
      const currentData = await clinicalApi.getCurrentLinkingCode();

      if (currentData && currentData.expiresInSeconds > 0) {
        applyLinkingCodeState(currentData.code, currentData.expiresInSeconds);
      } else {
        await generateNewCode();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewCode = async () => {
    try {
      setIsLoading(true);
      setShowExpiredDialog(false);
      setIsExpired(false);
      const data = await clinicalApi.generateLinkingCode();
      applyLinkingCodeState(data.code, data.expiresInSeconds);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrGenerateCode();
  }, []);

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const updateTimeLeft = () => {
      const nextTimeLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setTimeLeft(nextTimeLeft);

      if (nextTimeLeft === 0) {
        setExpiresAt(null);
        setCode(null);
        setIsExpired(true);
        setShowExpiredDialog(true);
      }
    };

    updateTimeLeft();
    const timer = window.setInterval(updateTimeLeft, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/patients/nutritionist')} className="mb-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} className="mr-2" />
        {t('common.backToPatients')}
      </Button>

      <Card className="max-w-md mx-auto text-center border-2 border-primary/10 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t('linking.title')}</CardTitle>
          <CardDescription>
            {t('linking.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-8 pb-8">
          {isLoading ? (
            <div className="h-[280px] flex items-center justify-center"><LoadingSpinner /></div>
          ) : isExpired ? (
            <div className="h-[280px] flex flex-col items-center justify-center space-y-4 bg-muted/30 w-full rounded-xl border border-dashed border-muted-foreground/30 p-6">
              <AlertCircle size={48} className="text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-foreground font-semibold">{t('linking.expiredTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('linking.expiredDesc')}</p>
              </div>
              <Button onClick={generateNewCode} className="mt-4 shadow-sm">
                <RefreshCw size={16} className="mr-2" />
                {t('linking.generateNewBtn')}
              </Button>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center w-full">
              <div className="bg-white p-4 rounded-xl shadow-sm border mb-8">
                {code && <QRCode value={code} size={220} level="H" />}
              </div>
              
              <div className="space-y-2 w-full mb-8">
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em] font-bold">{t('linking.manualCodeLabel')}</p>
                <div className="flex justify-center">
                  <p className="text-4xl font-black tracking-[0.25em] text-primary bg-primary/5 py-3 px-8 rounded-xl border-2 border-primary/20 select-all">
                    {code}
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 px-5 py-2.5 rounded-full font-medium text-sm flex items-center gap-2.5 shadow-sm border border-orange-200 dark:border-orange-500/20">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                </span>
                {t('linking.expiresIn')} <span className="font-bold tabular-nums w-10 text-left">{formatTime(timeLeft || 0)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={showExpiredDialog}
        onClose={() => setShowExpiredDialog(false)}
        onConfirm={generateNewCode}
        title={t('linking.expiredTitle')}
        description={t('linking.expiredDesc')}
        confirmText={t('linking.generateNewBtn')}
        cancelText={t('common.cancel')}
        icon={<AlertCircle size={24} />}
        isLoading={isLoading}
      />
    </div>
  );
};
