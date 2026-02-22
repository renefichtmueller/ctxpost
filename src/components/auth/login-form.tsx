"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { loginUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

export function LoginForm() {
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth");

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await loginUser(formData);
      if (result?.error) {
        toast.error(result.error);
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-mono" style={{ color: "#22d3ee" }}>// SIGNIN</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Willkommen zurück</h2>
        <p className="text-sm" style={{ color: "#94a3b8" }}>
          Meld dich an und starte deine KI-Content-Session.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            {t("email")}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            required
            className="h-11 text-white placeholder:text-slate-300"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(168, 85, 247, 0.15)",
              borderRadius: "0.625rem",
            }}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            {t("password")}
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("passwordHint")}
              required
              className="h-11 text-white placeholder:text-slate-300 pr-11"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(168, 85, 247, 0.15)",
                borderRadius: "0.625rem",
              }}
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

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={pending}
          className="w-full h-11 font-semibold text-white gradient-primary border-0 mt-2 group relative overflow-hidden"
          style={{ boxShadow: pending ? "none" : "0 0 20px rgba(124, 58, 237, 0.4)" }}
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Authentifiziere...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {t("login")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: "rgba(168, 85, 247, 0.1)" }} />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-xs" style={{ background: "#0d1424", color: "#334155" }}>
            NEU BEI CTXPOST?
          </span>
        </div>
      </div>

      {/* Register Link */}
      <Link
        href="/register"
        className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.01]"
        style={{
          background: "rgba(168, 85, 247, 0.06)",
          border: "1px solid rgba(168, 85, 247, 0.15)",
          color: "#a855f7",
        }}
      >
        {t("register")}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
