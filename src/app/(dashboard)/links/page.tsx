import { getTranslations } from "next-intl/server";
import { getShortLinks } from "@/actions/short-links";
import { LinkManager } from "@/components/links/link-manager";

export default async function LinksPage() {
  const t = await getTranslations("links");
  const links = await getShortLinks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <LinkManager initialLinks={links} />
    </div>
  );
}
