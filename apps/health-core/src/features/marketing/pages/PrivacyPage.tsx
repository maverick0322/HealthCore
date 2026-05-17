import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { MarketingSettingsBar } from "@/features/marketing/components/MarketingSettingsBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { Button } from "@/shared/ui/button";

export const PrivacyPage = () => {
  const { t } = useTranslation("legal");

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <MarketingSettingsBar />
      <div className="max-w-4xl mx-auto px-4">
        <div className="py-4" />

        <div className="flex items-center justify-between gap-3 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{t("privacy.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("privacy.subtitle")}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/">{t("common.back")}</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("common.updatedTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 leading-relaxed">
            <p className="text-sm text-muted-foreground">{t("common.updatedBody")}</p>
            <Separator />

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("privacy.sections.summary.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("privacy.sections.summary.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("privacy.sections.dataWeCollect.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("privacy.sections.dataWeCollect.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("privacy.sections.howWeUse.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("privacy.sections.howWeUse.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("privacy.sections.sharing.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("privacy.sections.sharing.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("privacy.sections.retention.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("privacy.sections.retention.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("privacy.sections.security.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("privacy.sections.security.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("privacy.sections.rights.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("privacy.sections.rights.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("privacy.sections.contact.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("privacy.sections.contact.body")}</p>
            </section>
          </CardContent>
        </Card>

        <footer className="py-10">
          <div className="text-xs text-muted-foreground">
            {t("common.footerNote")}
          </div>
        </footer>
      </div>
    </div>
  );
};
