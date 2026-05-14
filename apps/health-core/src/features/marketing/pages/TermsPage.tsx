import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { MarketingSettingsBar } from "@/features/marketing/components/MarketingSettingsBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { Button } from "@/shared/ui/button";

export const TermsPage = () => {
  const { t } = useTranslation("legal");

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <MarketingSettingsBar />
      <div className="max-w-4xl mx-auto px-4">
        <div className="py-4" />

        <div className="flex items-center justify-between gap-3 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{t("terms.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("terms.subtitle")}</p>
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
              <h2 className="text-sm font-semibold">{t("terms.sections.acceptance.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("terms.sections.acceptance.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("terms.sections.eligibility.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("terms.sections.eligibility.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("terms.sections.use.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("terms.sections.use.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("terms.sections.health.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("terms.sections.health.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("terms.sections.accounts.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("terms.sections.accounts.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("terms.sections.payments.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("terms.sections.payments.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("terms.sections.ip.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("terms.sections.ip.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("terms.sections.termination.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("terms.sections.termination.body")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("terms.sections.contact.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("terms.sections.contact.body")}</p>
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
