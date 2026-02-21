import { getTranslations, getLocale } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const locale = await getLocale();
  const formattedDate = new Date().toLocaleDateString(locale);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
        <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

        <p className="text-muted-foreground mb-6">
          {t("lastUpdated", { date: formattedDate })}
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">{t("section1Title")}</h2>
        <p>{t("section1Text")}</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">{t("section2Title")}</h2>
        <p>{t("section2Intro")}</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>{t("section2Item1")}</strong></li>
          <li><strong>{t("section2Item2")}</strong></li>
          <li><strong>{t("section2Item3")}</strong></li>
          <li><strong>{t("section2Item4")}</strong></li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">{t("section3Title")}</h2>
        <p>{t("section3Intro")}</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>{t("section3Item1")}</li>
          <li>{t("section3Item2")}</li>
          <li>{t("section3Item3")}</li>
          <li>{t("section3Item4")}</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">{t("section4Title")}</h2>
        <p>{t("section4Text")}</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">{t("section5Title")}</h2>
        <p>{t("section5Text")}</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">{t("section6Title")}</h2>
        <p>{t("section6Intro")}</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>{t("section6Item1")}</li>
          <li>{t("section6Item2")}</li>
          <li>{t("section6Item3")}</li>
          <li>{t("section6Item4")}</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">{t("section7Title")}</h2>
        <p>{t("section7Text")}</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">{t("section8Title")}</h2>
        <p>{t("section8Text")}</p>
      </div>
    </div>
  );
}
