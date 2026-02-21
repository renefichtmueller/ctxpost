import { getTranslations } from "next-intl/server";
import { getMediaAssets, getAllTags } from "@/actions/media-library";
import { MediaLibrary } from "@/components/library/media-library";

export default async function LibraryPage() {
  const t = await getTranslations("library");
  const { assets, total } = await getMediaAssets();
  const allTags = await getAllTags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <MediaLibrary initialAssets={assets} totalAssets={total} allTags={allTags} />
    </div>
  );
}
