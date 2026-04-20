import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";
import { SettingsBar } from "@/shared/components/SettingsBar";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/shared/ui/input-otp";
import { useVerifyCode } from "../hooks/useVerifyCode";

interface LocationState {
  email?: string;
  flow?: 'email-verification' | 'password-reset';
}

export const VerifyCodePage = () => {
  const { t } = useTranslation("auth");
  const location = useLocation();
  const state = (location.state as LocationState) || {};
  const email = state.email || '';
  const flow = state.flow || 'email-verification';

  const [code, setCode] = useState("");
  const { handleVerifyCode, isLoading, error } = useVerifyCode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      await handleVerifyCode(email, code, flow);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-8 bg-background text-foreground font-sans relative transition-colors duration-500 ease-in-out">
      
      {/* Global Settings */}
      <SettingsBar />

      <div className="w-full max-w-[480px] space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Card Form */}
        <div className="bg-card text-card-foreground p-8 sm:p-10 rounded-xl sm:rounded-2xl border border-border shadow-md transition-colors duration-500 flex flex-col items-center">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-8 p-4 bg-primary/10 rounded-full text-primary shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-center mb-2 tracking-tight">
              {t("verifyAccount")}
            </h1>
            <p className="text-muted-foreground text-sm text-center leading-relaxed">
              {t("verifySubtitle")}<br/>
              <span className="font-medium text-foreground">{email || '—'}</span>
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-2 duration-300 mb-6 w-full">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col w-full gap-8">
            <div className="flex justify-center w-full">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup className="gap-2 sm:gap-4">
                  <InputOTPSlot index={0} className="w-12 h-14 sm:w-14 sm:h-16 text-xl font-bold border-2 rounded-lg bg-transparent focus-visible:border-primary focus-visible:ring-0" />
                  <InputOTPSlot index={1} className="w-12 h-14 sm:w-14 sm:h-16 text-xl font-bold border-2 rounded-lg bg-transparent focus-visible:border-primary focus-visible:ring-0" />
                  <InputOTPSlot index={2} className="w-12 h-14 sm:w-14 sm:h-16 text-xl font-bold border-2 rounded-lg bg-transparent focus-visible:border-primary focus-visible:ring-0" />
                  <InputOTPSlot index={3} className="w-12 h-14 sm:w-14 sm:h-16 text-xl font-bold border-2 rounded-lg bg-transparent focus-visible:border-primary focus-visible:ring-0" />
                  <InputOTPSlot index={4} className="w-12 h-14 sm:w-14 sm:h-16 text-xl font-bold border-2 rounded-lg bg-transparent focus-visible:border-primary focus-visible:ring-0" />
                  <InputOTPSlot index={5} className="w-12 h-14 sm:w-14 sm:h-16 text-xl font-bold border-2 rounded-lg bg-transparent focus-visible:border-primary focus-visible:ring-0" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("verifyButton")
              )}
            </Button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 flex flex-col items-center gap-3 w-full">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground w-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span><Trans i18nKey="resendCode" t={t} values={{ time: "00:59" }} /></span>
            </div>
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline underline-offset-4 transition-colors">
              {t("changeEmail")}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
