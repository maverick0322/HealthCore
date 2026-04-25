import { useTranslation } from "react-i18next";
import { User, Mail, Phone, MapPin, Award, Video, FileText } from "lucide-react";

import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

export const NutritionistProfilePage = () => {
  const { t } = useTranslation("nutritionist");

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <NutritionistNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t("profile.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("profile.subtitle")}
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <FileText size={16} />
            {t("profile.editProfile")}
          </Button>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* Profile Card */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="h-32 bg-primary/20" />
          <div className="px-6 pb-6">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="w-24 h-24 rounded-full border-4 border-card bg-primary flex items-center justify-center text-primary-foreground text-4xl font-bold">
                D
              </div>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Lic. Daniel Martínez</h2>
              <p className="text-primary font-medium flex items-center gap-1.5">
                <Award size={16} /> Nutrición Clínica y Deportiva
              </p>
            </div>
          </div>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <User size={18} className="text-primary" /> Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-muted-foreground" />
                <span className="text-sm">daniel.martinez@healthcore.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-muted-foreground" />
                <span className="text-sm">+52 55 1234 5678</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-muted-foreground" />
                <span className="text-sm">Torre Médica Sur, Consultorio 412. CDMX.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText size={18} className="text-primary" /> Credenciales
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">{t("profile.license")}</p>
                <p className="text-sm font-medium">123456789 (SEP)</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">{t("profile.consultationType")}</p>
                <div className="flex gap-2 mt-1">
                  <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                    <MapPin size={12} /> Presencial
                  </span>
                  <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                    <Video size={12} /> Online
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm md:col-span-2">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText size={18} className="text-primary" /> {t("profile.bio")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Especialista en nutrición clínica enfocado en la prevención y tratamiento de enfermedades crónicas. 
                Certificado en Nutrición Deportiva Avanzada, ayudando a atletas de alto rendimiento a alcanzar sus metas físicas.
                Mi enfoque se basa en la creación de hábitos sostenibles y no en dietas restrictivas temporales.
              </p>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
};
