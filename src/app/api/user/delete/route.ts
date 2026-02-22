import { NextRequest, NextResponse } from "next/server";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { unlink } from "fs/promises";
import path from "path";

// DSGVO Art. 17 – Recht auf Löschung ("Recht auf Vergessenwerden")
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Require confirmation token in body
  const body = await request.json().catch(() => null);
  if (body?.confirmation !== "DELETE") {
    return NextResponse.json(
      { error: "Confirmation required. Send { confirmation: 'DELETE' }" },
      { status: 400 }
    );
  }

  try {
    // Log before deletion (audit trail retained briefly for compliance)
    await logAudit(userId, "ACCOUNT_DELETE", {
      email: session.user.email,
      requestedAt: new Date().toISOString(),
    });

    // Delete uploaded media files from disk
    const mediaAssets = await prisma.mediaAsset.findMany({
      where: { userId },
      select: { url: true },
    });

    for (const asset of mediaAssets) {
      if (asset.url.startsWith("/api/uploads/")) {
        const filename = asset.url.replace("/api/uploads/", "");
        const filepath = path.join(process.cwd(), "uploads", filename);
        try {
          await unlink(filepath);
        } catch {
          // File may already be deleted, continue
        }
      }
    }

    // Prisma cascading delete handles all related records
    // (Account, Session, SocialAccount, Post, PostTarget, PostAnalytics,
    //  ContentCategory, MediaAsset, AIInsight, BrandStyleGuide, AppConfig,
    //  ShortLink, TeamMember, ConsentLog, AuditLog, ContentVariation, AIFeedback)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GDPR] Account deletion error:", error);
    return NextResponse.json(
      { error: "Deletion failed" },
      { status: 500 }
    );
  }
}
