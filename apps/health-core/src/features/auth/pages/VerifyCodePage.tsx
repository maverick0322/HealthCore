import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { FieldError } from "@/shared/components/FieldError";
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

const isLocationState = (state: unknown): state is LocationState =>
  typeof state === "object" &&
  state !== null &&
  (!("email" in state) || typeof state.email === "string") &&
  (!("flow" in state) ||
    state.flow === 'email-verification' ||
    state.flow === 'password-reset');

export const VerifyCodePage = () => {
  const { t } = useTranslation("auth");
  const location = useLocation();
  const state = isLocationState(location.state) ? location.state : {};
  const email = state.email || '';
  const flow = state.flow || 'email-verification';

  const [code, setCode] = useState("");
  const { handleVerifyCode, isLoading, error, fieldErrors } = useVerifyCode();
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResend = () => {
    setTimeLeft(60);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleVerifyCode(email, code, flow);
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
              {t("verifySubtitle")}<br />
              <span className="font-medium text-foreground">{email || '—'}</span>
            </p>
          </div>

          {/* Server error banner */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-2 duration-300 mb-6 w-full">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4" noValidate>
            <div className="flex flex-col items-center gap-2 w-full">
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
              <FieldError id="code-error" message={fieldErrors.code} />
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 mt-4"
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
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {timeLeft > 0 ? (
                <span>{t("resendCode", { time: formatTime(timeLeft) })}</span>
              ) : (
                <button type="button" onClick={handleResend} className="font-medium text-primary hover:underline underline-offset-4 transition-colors">
                  {t("resendCode", { time: "" }).replace(/\s*\(disponible en\s*\)|\(available in\s*\)/ig, "").trim()}
                </button>
              )}
            </div>
            <Link
              to={flow === "password-reset" ? "/forgot-password" : "/signup"}
              state={{ email }}
              className="text-sm font-medium text-primary hover:underline underline-offset-4 transition-colors"
            >
              {t("changeEmail")}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
