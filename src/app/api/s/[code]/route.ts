import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const link = await prisma.shortLink.findUnique({
    where: { shortCode: code },
  });

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  // Increment click count
  await prisma.shortLink.update({
    where: { id: link.id },
    data: { clicks: { increment: 1 } },
  });

  // Build URL with UTM parameters and validate protocol
  const url = new URL(link.originalUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 });
  }
  if (link.utmSource) url.searchParams.set("utm_source", link.utmSource);
  if (link.utmMedium) url.searchParams.set("utm_medium", link.utmMedium);
  if (link.utmCampaign) url.searchParams.set("utm_campaign", link.utmCampaign);
  if (link.utmTerm) url.searchParams.set("utm_term", link.utmTerm);
  if (link.utmContent) url.searchParams.set("utm_content", link.utmContent);

  return NextResponse.redirect(url.toString());
}
