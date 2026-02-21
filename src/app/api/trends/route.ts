import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { fetchGoogleTrends, localeToGeo } from "@/lib/data/google-trends";
import { getLocale } from "next-intl/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locale = await getLocale();
  const geo = localeToGeo(locale);
  const trends = await fetchGoogleTrends(geo);

  return NextResponse.json({
    trends: trends.slice(0, 15),
    geo,
    fetchedAt: new Date().toISOString(),
  });
}
