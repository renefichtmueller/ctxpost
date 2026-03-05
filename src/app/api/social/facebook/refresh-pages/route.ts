/**
 * POST /api/social/facebook/refresh-pages
 *
 * Re-fetches all Facebook Pages the user manages using the stored user token.
 * Upserts pages into the DB — new pages get added, existing ones get updated.
 * Does NOT require a new OAuth flow.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt, encrypt } from "@/lib/crypto";

const GRAPH_API_VERSION = "v22.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

function decryptToken(token: string): string {
  if (!process.env.ENCRYPTION_KEY) return token;
  try { return decrypt(token); } catch { return token; }
}

function encryptToken(token: string): string {
  if (!process.env.ENCRYPTION_KEY) return token;
  try { return encrypt(token); } catch { return token; }
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the stored Facebook profile account (accountType = "profile")
  const profileAccount = await prisma.socialAccount.findFirst({
    where: {
      userId: session.user.id,
      platform: "FACEBOOK",
      accountType: "profile",
      isActive: true,
    },
  });

  if (!profileAccount) {
    return NextResponse.json(
      { error: "Kein verbundenes Facebook-Profil gefunden. Bitte zuerst Facebook verbinden." },
      { status: 400 }
    );
  }

  const userToken = decryptToken(profileAccount.accessToken);

  // Validate the token is still alive
  const validateRes = await fetch(`${GRAPH_API_BASE}/me?access_token=${userToken}`);
  if (!validateRes.ok) {
    return NextResponse.json(
      { error: "Facebook-Token abgelaufen. Bitte Facebook erneut verbinden." },
      { status: 400 }
    );
  }

  // Fetch all pages
  const pagesRes = await fetch(
    `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,category,fan_count,picture&access_token=${userToken}`
  );

  if (!pagesRes.ok) {
    const errorText = await pagesRes.text();
    console.error("[FB Refresh Pages] Pages fetch failed:", errorText);
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Facebook-Seiten." },
      { status: 500 }
    );
  }

  const pagesData = await pagesRes.json();
  const pages: Array<{
    id: string;
    name: string;
    access_token: string;
    category?: string;
    fan_count?: number;
    picture?: { data?: { url?: string } };
  }> = pagesData.data || [];

  console.log(`[FB Refresh Pages] Found ${pages.length} pages for user ${session.user.id}`);

  let added = 0;
  let updated = 0;

  for (const page of pages) {
    const existing = await prisma.socialAccount.findFirst({
      where: {
        userId: session.user.id,
        platform: "FACEBOOK",
        platformUserId: page.id,
      },
    });

    const pageData = {
      accessToken: encryptToken(page.access_token),
      accountName: `📄 ${page.name}`,
      avatarUrl: page.picture?.data?.url || null,
      followerCount: page.fan_count || null,
      parentAccountId: profileAccount.id,
      isActive: true,
    };

    if (existing) {
      await prisma.socialAccount.update({
        where: { id: existing.id },
        data: pageData,
      });
      updated++;
    } else {
      await prisma.socialAccount.create({
        data: {
          userId: session.user.id,
          platform: "FACEBOOK",
          platformUserId: page.id,
          accountType: "page",
          ...pageData,
        },
      });
      added++;
      console.log(`[FB Refresh Pages] New page added: ${page.name} (${page.id})`);
    }
  }

  return NextResponse.json({
    success: true,
    total: pages.length,
    added,
    updated,
    message: added > 0
      ? `${added} neue Seite${added !== 1 ? "n" : ""} hinzugefügt, ${updated} aktualisiert.`
      : `Alle ${updated} Seiten sind bereits verbunden.`,
  });
}
