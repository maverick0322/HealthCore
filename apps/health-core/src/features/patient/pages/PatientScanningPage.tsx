import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Camera, Keyboard, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { clinicalApi } from '@/features/clinical/services/clinicalService';
import { getPatientLinkingErrorMessage } from '@/features/clinical/utils/linkingErrorMessages';
import { QrScanner } from '@/shared/components/QrScanner';
import { useProfileGuard } from '@/features/onboarding/hooks/useProfileGuard';
import { ConfirmModal } from '@/shared/components/ConfirmModal';

export const PatientScanningPage = () => {
  const { t } = useTranslation('patient');
  const navigate = useNavigate();
  const { isLoading: profileLoading } = useProfileGuard();
  
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAlreadyLinked, setIsAlreadyLinked] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Check if patient is already linked to a nutritionist
  useEffect(() => {
    const checkLinkingStatus = async () => {
      try {
        const isLinked = await clinicalApi.isPatientLinked();
        setIsAlreadyLinked(isLinked);
      } catch (error) {
        console.error('Error checking linking status:', error);
      }
    };

    if (!profileLoading) {
      checkLinkingStatus();
    }
  }, [profileLoading]);

  const handleUnlinkNutritionist = async () => {
    try {
      setIsUnlinking(true);
      await clinicalApi.unlinkPatient();
      setIsAlreadyLinked(false);
      setShowUnlinkDialog(false);
      setFeedback({ type: 'success', message: t('linking.unlinkSuccess') });
      
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (error) {
      setFeedback({ 
        type: 'error', 
        message: getPatientLinkingErrorMessage(error, t, 'unlink')
      });
      setShowUnlinkDialog(false);
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleLinkNutritionist = async (codeToLink: string) => {
    setFeedback(null);
    
    if (!codeToLink || codeToLink.length !== 6) {
      setFeedback({ type: 'error', message: t('linking.invalidCodeFormat') });
      return;
    }

    try {
      setIsLoading(true);
      await clinicalApi.linkPatient({ code: codeToLink.toUpperCase() });
      setFeedback({ type: 'success', message: t('linking.success') });
      
      // Redirect to profile after success
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (error: any) {
      if (error.response?.status === 409) {
        setIsAlreadyLinked(true);
      }
      setFeedback({
        type: 'error',
        message: getPatientLinkingErrorMessage(error, t, 'link'),
      });
    } finally {
      setIsLoading(false);
      setManualCode('');
    }
  };

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
        onClick={() => navigate('/profile')} 
        className="mb-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} className="mr-2" />
        {t('common.back')}
      </Button>

      <Card className="border-2 border-primary/10 shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t('linking.title')}</CardTitle>
          <CardDescription>
            {t('linking.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col items-center">

          {/* Feedback UI */}
          {feedback && (
            <div className={`w-full max-w-sm p-4 rounded-lg flex items-center gap-3 ${
              feedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {feedback.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              <span className="font-medium text-sm">{feedback.message}</span>
            </div>
          )}

          {/* Show message if already linked */}
          {isAlreadyLinked && (
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
          )}

          {/* Opción 1: Código Manual */}
          <div className="w-full max-w-sm space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Keyboard className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder={t('linking.inputPlaceholder')}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="pl-10 text-center text-2xl tracking-[0.2em] font-bold uppercase h-14 rounded-xl"
                maxLength={6}
                disabled={isLoading || isScanning || isAlreadyLinked}
              />
            </div>
            <Button 
              className="w-full h-12 text-lg shadow-sm" 
              onClick={() => handleLinkNutritionist(manualCode)}
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

          {/* Opción 2: Escáner QR */}
          <div className="w-full max-w-sm flex flex-col items-center gap-4">
            <Button 
              variant={isScanning ? "destructive" : "outline"} 
              className="w-full h-12 shadow-sm border-2"
              onClick={() => setIsScanning(!isScanning)}
              disabled={isLoading || isAlreadyLinked}
            >
              <Camera size={18} className="mr-2" />
              {isScanning ? t('linking.stopScan') : t('linking.startScan')}
            </Button>

            <div className="w-full">
              <QrScanner 
                isScanning={isScanning} 
                onScan={(data) => {
                  setIsScanning(false);
                  handleLinkNutritionist(data);
                }} 
              />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Unlink Confirmation Dialog */}
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
