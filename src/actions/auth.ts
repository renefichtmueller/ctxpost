"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema, loginSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { logAudit, logConsent } from "@/lib/audit";

const PRIVACY_POLICY_VERSION = "1.0.0";

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function registerUser(formData: FormData) {
  const tAuth = await getTranslations("auth");

  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`register:${ip}`, RATE_LIMITS.auth);
  if (!allowed) return { error: "Too many attempts. Please try again later." };

  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    privacyConsent: formData.get("privacyConsent") as string,
  };

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0].message;
    return { error: tAuth(firstIssue) };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existingUser) {
    return { error: tAuth("emailExists") };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
  const now = new Date();

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      hashedPassword,
      privacyConsentAt: now,
      termsConsentAt: now,
      consentVersion: PRIVACY_POLICY_VERSION,
    },
  });

  // Log consent (DSGVO Art. 7 – Nachweispflicht)
  await Promise.all([
    logConsent(user.id, "PRIVACY_POLICY", "GRANTED", PRIVACY_POLICY_VERSION),
    logConsent(user.id, "TERMS_OF_SERVICE", "GRANTED", PRIVACY_POLICY_VERSION),
    logAudit(user.id, "REGISTER", { email: parsed.data.email }),
  ]);

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: tAuth("registerError") };
    }
    throw error;
  }
}

export async function loginUser(formData: FormData) {
  const tAuth = await getTranslations("auth");

  const ip = await getClientIp();
  const email = (formData.get("email") as string) || "";
  const { allowed } = checkRateLimit(`login:${ip}:${email}`, RATE_LIMITS.auth);
  if (!allowed) return { error: "Too many login attempts. Please try again later." };

  const rawData = {
    email,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    // Find user to log audit before signIn redirects
    const loginUser = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
    if (loginUser) {
      await logAudit(loginUser.id, "LOGIN", { email: parsed.data.email });
    }

    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: tAuth("invalidCredentials") };
    }
    throw error;
  }
}

export async function logoutUser() {
  // Auth session check before signOut is tricky (signOut clears session),
  // so we import auth inline to get userId
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (session?.user?.id) {
    await logAudit(session.user.id, "LOGOUT", {});
  }
  await signOut({ redirectTo: "/login" });
}
