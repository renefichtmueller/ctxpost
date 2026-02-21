import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcoming = await prisma.post.findMany({
    where: {
      userId: session.user.id,
      status: "SCHEDULED",
      scheduledAt: {
        gte: now,
        lte: sevenDaysFromNow,
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 10,
    select: {
      id: true,
      content: true,
      scheduledAt: true,
      status: true,
      targets: {
        select: {
          id: true,
          socialAccount: {
            select: {
              platform: true,
            },
          },
        },
      },
    },
  });

  const posts = upcoming.map((post) => ({
    id: post.id,
    content: post.content.length > 100 ? post.content.substring(0, 100) + "..." : post.content,
    scheduledAt: post.scheduledAt?.toISOString() || null,
    status: post.status,
    targets: post.targets.map((target) => ({
      id: target.id,
      platform: target.socialAccount.platform,
    })),
  }));

  return NextResponse.json({ posts });
}
