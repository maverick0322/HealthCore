import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { SettingsBar } from "@/shared/components/SettingsBar";

export const ForgotPasswordPage = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API request here
    navigate("/verify-code");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-8 bg-background text-foreground font-sans relative transition-colors duration-500 ease-in-out">
      
      {/* Global Settings */}
      <SettingsBar />

      <div className="w-full max-w-[440px] space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Card Form */}
        <div className="bg-card text-card-foreground p-6 sm:p-10 rounded-xl sm:rounded-2xl border border-border shadow-md transition-colors duration-500">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-center mb-2">
              {t("forgotPassword")}
            </h1>
            <p className="text-muted-foreground text-sm text-center leading-relaxed">
              {t("forgotPasswordSubtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium leading-none">
                {t("email")}
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  className="h-12 text-base sm:text-sm bg-background border-border placeholder:text-muted-foreground transition-all duration-200" 
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
              {t("sendInstructions")}
            </Button>
          </form>

          {/* Footer Section */}
          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              {t("backToLogin")}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
