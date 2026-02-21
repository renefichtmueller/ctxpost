import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { InboxView } from "@/components/inbox/inbox-view";

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("inbox");

  // Fetch published posts with their targets (for platform info) and analytics
  const posts = await prisma.post.findMany({
    where: {
      userId: session.user.id,
      status: "PUBLISHED",
    },
    include: {
      targets: {
        include: {
          socialAccount: {
            select: {
              id: true,
              platform: true,
              accountName: true,
            },
          },
        },
      },
      analytics: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  // Serialize dates for the client component
  const serializedPosts = posts.map((post) => ({
    id: post.id,
    content: post.content,
    contentType: post.contentType,
    imageUrl: post.imageUrl,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    targets: post.targets.map((target) => ({
      id: target.id,
      platformPostId: target.platformPostId,
      platform: target.socialAccount.platform,
      accountName: target.socialAccount.accountName,
      publishedAt: target.publishedAt?.toISOString() ?? null,
    })),
    analytics: post.analytics.map((a) => ({
      id: a.id,
      platform: a.platform,
      likes: a.likes,
      comments: a.comments,
      shares: a.shares,
      impressions: a.impressions,
      clicks: a.clicks,
      engagementRate: a.engagementRate,
      fetchedAt: a.fetchedAt.toISOString(),
    })),
  }));

  return <InboxView posts={serializedPosts} />;
}
