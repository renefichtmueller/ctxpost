"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { registerUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, Eye, EyeOff, ArrowRight, Loader2, User, Mail, Lock } from "lucide-react";

export function RegisterForm() {
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth");

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await registerUser(formData);
      if (result?.error) {
        toast.error(result.error);
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setPending(false);
    }
  }

  const inputStyle = {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(168, 85, 247, 0.15)",
    borderRadius: "0.625rem",
  };

  const labelStyle = "text-slate-400 text-xs font-medium uppercase tracking-wider";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-mono" style={{ color: "#22d3ee" }}>// NEW_USER</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Account erstellen</h2>
        <p className="text-sm" style={{ color: "#94a3b8" }}>
          Starte deine KI-gestützte Content-Reise.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-3.5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className={labelStyle}>
            {t("name")}
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <Input
              id="name"
              name="name"
              type="text"
              placeholder={t("namePlaceholder")}
              required
              className="h-11 text-white placeholder:text-slate-300 pl-9"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className={labelStyle}>
            {t("email")}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              required
              className="h-11 text-white placeholder:text-slate-300 pl-9"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className={labelStyle}>
            {t("password")}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("passwordHint")}
              required
              className="h-11 text-white placeholder:text-slate-300 pl-9 pr-11"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className={labelStyle}>
            {t("passwordConfirm")}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder={t("passwordConfirmPlaceholder")}
              required
              className="h-11 text-white placeholder:text-slate-300 pl-9 pr-11"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-300 transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* DSGVO Consent Checkbox */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            id="privacyConsent"
            name="privacyConsent"
            required
            className="mt-1 h-4 w-4 shrink-0 rounded border-purple-500/30 bg-white/5 text-purple-500 focus:ring-purple-500/50 accent-purple-500"
          />
          <label htmlFor="privacyConsent" className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
            {t("consentLabel")}{" "}
            <Link href="/privacy" target="_blank" className="underline" style={{ color: "#a855f7" }}>
              {t("privacyPolicy")}
            </Link>{" "}
            {t("consentAnd")}{" "}
            <Link href="/terms" target="_blank" className="underline" style={{ color: "#a855f7" }}>
              {t("termsOfService")}
            </Link>{" "}
            {t("consentAccepted")}
          </label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={pending}
          className="w-full h-11 font-semibold text-white gradient-primary border-0 mt-1 group"
          style={{ boxShadow: pending ? "none" : "0 0 20px rgba(124, 58, 237, 0.4)" }}
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Erstelle Account...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {t("register")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          )}
        </Button>
      </form>

      {/* Login Link */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: "rgba(168, 85, 247, 0.1)" }} />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-xs" style={{ background: "#0d1424", color: "#334155" }}>
            BEREITS ACCOUNT?
          </span>
        </div>
      </div>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-sm font-medium transition-all duration-200"
        style={{
          background: "rgba(168, 85, 247, 0.06)",
          border: "1px solid rgba(168, 85, 247, 0.15)",
          color: "#a855f7",
        }}
      >
        {t("login")}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
