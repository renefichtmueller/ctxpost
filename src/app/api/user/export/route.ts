import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// DSGVO Art. 15 (Auskunftsrecht) + Art. 20 (Datenübertragbarkeit)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, socialAccounts, posts, categories, mediaAssets, brandStyle, aiInsights, shortLinks, consentLogs, auditLogs] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          timezone: true,
          aiProvider: true,
          textModel: true,
          imageModel: true,
          analysisModel: true,
          ollamaUrl: true,
          imageGenProvider: true,
          privacyConsentAt: true,
          termsConsentAt: true,
          consentVersion: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.socialAccount.findMany({
        where: { userId },
        select: {
          id: true,
          platform: true,
          accountName: true,
          accountType: true,
          isActive: true,
          createdAt: true,
          // Explicitly exclude accessToken and refreshToken
        },
      }),
      prisma.post.findMany({
        where: { userId },
        select: {
          id: true,
          content: true,
          contentType: true,
          scheduledAt: true,
          publishedAt: true,
          status: true,
          categoryId: true,
          createdAt: true,
          targets: {
            select: {
              socialAccountId: true,
              status: true,
              publishedAt: true,
            },
          },
          analytics: {
            select: {
              platform: true,
              likes: true,
              comments: true,
              shares: true,
              impressions: true,
              clicks: true,
              fetchedAt: true,
            },
          },
        },
      }),
      prisma.contentCategory.findMany({
        where: { userId },
        select: { id: true, name: true, color: true, description: true },
      }),
      prisma.mediaAsset.findMany({
        where: { userId },
        select: {
          id: true,
          filename: true,
          mimeType: true,
          fileSize: true,
          tags: true,
          altText: true,
          createdAt: true,
        },
      }),
      prisma.brandStyleGuide.findUnique({
        where: { userId },
        select: {
          tone: true,
          formality: true,
          emojiUsage: true,
          targetAudience: true,
          brandVoice: true,
          hashtagStrategy: true,
          languages: true,
          customInstructions: true,
        },
      }),
      prisma.aIInsight.findMany({
        where: { userId },
        select: {
          type: true,
          data: true,
          modelUsed: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.shortLink.findMany({
        where: { userId },
        select: {
          shortCode: true,
          originalUrl: true,
          clicks: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          createdAt: true,
        },
      }),
      prisma.consentLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

  // Log the data export (DSGVO Art. 15 Nachweispflicht)
  await logAudit(userId, "DATA_EXPORT", { format: "json" });

  const exportData = {
    exportedAt: new Date().toISOString(),
    exportFormat: "GDPR_Art15_Art20",
    user,
    socialAccounts,
    posts,
    categories,
    mediaAssets,
    brandStyle,
    aiInsights,
    shortLinks,
    consentLogs,
    auditLogs,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ctxpost-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
