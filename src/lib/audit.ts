"use server";

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import type { AuditAction } from "@prisma/client";

export async function logAudit(
  userId: string,
  action: AuditAction,
  details?: Record<string, unknown>
) {
  try {
    const h = await headers();
    const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const userAgent = h.get("user-agent") || null;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("[AuditLog] Failed to log:", action, error);
  }
}

export async function logConsent(
  userId: string,
  type: "PRIVACY_POLICY" | "TERMS_OF_SERVICE" | "MARKETING" | "COOKIE_ANALYTICS",
  action: "GRANTED" | "WITHDRAWN",
  version: string
) {
  try {
    const h = await headers();
    const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const userAgent = h.get("user-agent") || null;

    await prisma.consentLog.create({
      data: {
        userId,
        type,
        action,
        version,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("[ConsentLog] Failed to log:", type, action, error);
  }
}
