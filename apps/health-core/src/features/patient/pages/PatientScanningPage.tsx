import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft, Camera, CheckCircle2, Keyboard, LogOut } from 'lucide-react';

import { usePatientScanningPage } from '@/features/patient/hooks/usePatientScanningPage';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { QrScanner } from '@/shared/components/QrScanner';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export const PatientScanningPage = () => {
  const { t } = useTranslation('patient');
  const {
    profileLoading,
    manualCode,
    setManualCode,
    isScanning,
    isLoading,
    isAlreadyLinked,
    feedback,
    showUnlinkDialog,
    setShowUnlinkDialog,
    isUnlinking,
    handleBackToProfile,
    handleUnlinkNutritionist,
    handleLinkNutritionist,
    handleScannerToggle,
    handleScanResult,
  } = usePatientScanningPage();

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <Button
        variant="ghost"
        onClick={handleBackToProfile}
        className="mb-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} className="mr-2" />
        {t('common.back')}
      </Button>

      <Card className="border-2 border-primary/10 shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t('linking.title')}</CardTitle>
          <CardDescription>{t('linking.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col items-center">
          {feedback ? (
            <div
              className={`w-full max-w-sm p-4 rounded-lg flex items-center gap-3 ${
                feedback.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}
            >
              {feedback.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              <span className="font-medium text-sm">{feedback.message}</span>
            </div>
          ) : null}

          {isAlreadyLinked ? (
            <div className="w-full max-w-sm bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 p-4 rounded-lg space-y-3">
              <p className="font-medium text-sm">{t('linking.alreadyLinkedDesc')}</p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => setShowUnlinkDialog(true)}
                disabled={isUnlinking}
              >
                <LogOut size={16} className="mr-2" />
                {t('linking.unlink')}
              </Button>
            </div>
          ) : null}

          <div className="w-full max-w-sm space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Keyboard className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder={t('linking.inputPlaceholder')}
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value.toUpperCase())}
                className="pl-10 text-center text-2xl tracking-[0.2em] font-bold uppercase h-14 rounded-xl"
                maxLength={6}
                disabled={isLoading || isScanning || isAlreadyLinked}
              />
            </div>
            <Button
              className="w-full h-12 text-lg shadow-sm"
              onClick={() => {
                void handleLinkNutritionist(manualCode);
              }}
              disabled={manualCode.length !== 6 || isLoading || isScanning || isAlreadyLinked}
            >
              {t('linking.connectButton')}
            </Button>
          </div>

          <div className="relative w-full max-w-sm">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('common.or')}</span>
            </div>
          </div>

          <div className="w-full max-w-sm flex flex-col items-center gap-4">
            <Button
              variant={isScanning ? 'destructive' : 'outline'}
              className="w-full h-12 shadow-sm border-2"
              onClick={handleScannerToggle}
              disabled={isLoading || isAlreadyLinked}
            >
              <Camera size={18} className="mr-2" />
              {isScanning ? t('linking.stopScan') : t('linking.startScan')}
            </Button>

            <div className="w-full">
              <QrScanner isScanning={isScanning} onScan={handleScanResult} />
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={showUnlinkDialog}
        onClose={() => setShowUnlinkDialog(false)}
        onConfirm={handleUnlinkNutritionist}
        title={t('linking.confirmUnlink')}
        description={t('linking.confirmUnlinkDesc')}
        icon={<LogOut size={24} />}
        isLoading={isUnlinking}
        isDestructive={true}
        confirmText={t('linking.unlink')}
        cancelText={t('common.cancel')}
      />
    </div>
  );
};
