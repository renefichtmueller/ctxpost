import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Calendar, BarChart3, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Social Scheduler" width={36} height={36} className="rounded-lg" />
          <span className="text-xl font-bold">Social Scheduler</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">{t("login")}</Button>
          </Link>
          <Link href="/register">
            <Button>{t("register")}</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            {t("heroTitle")}
            <br />
            <span className="text-primary">{t("heroHighlight")}</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            {t("heroDesc")}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                {t("cta")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <Calendar className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("feature1Title")}</h3>
            <p className="text-muted-foreground">
              {t("feature1Desc")}
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <Sparkles className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("feature2Title")}</h3>
            <p className="text-muted-foreground">
              {t("feature2Desc")}
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <BarChart3 className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("feature3Title")}</h3>
            <p className="text-muted-foreground">
              {t("feature3Desc")}
            </p>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground border-t mt-20">
        Social Scheduler &mdash; {t("footer")}
      </footer>
    </div>
  );
}
