import Link from "next/link";
import { Zap, Shield } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex dark" style={{ colorScheme: "dark" }}>
      {/* ── Left Panel: Mini Product Demo ── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "#0a1020" }}
      >
        {/* Aurora mesh background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99,102,241,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 90%, rgba(34,211,238,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 50% 50%, rgba(79,70,229,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #818cf8 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top: Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                boxShadow: "0 0 18px rgba(99,102,241,0.45)",
              }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight">
                CtxPost
              </span>
              <span
                className="block text-[10px] font-mono"
                style={{ color: "#818cf8" }}
              >
                v2.0 // LOCAL-FIRST AI
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Headline + Mini Product Mockup */}
        <div className="relative z-10 space-y-6">
          {/* Headline */}
          <div className="space-y-3">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "#a5b4fc",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#6366f1" }}
              />
              KI-gestützte Social Media Platform
            </div>
            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              Eine Idee.{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #6366f1, #22d3ee)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Fünf Plattformen.
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Erstelle, plane und analysiere Social-Media-Beiträge mit lokaler KI-Power –
              kein Cloud-Zwang, volle Kontrolle.
            </p>
          </div>

          {/* Mini Product Mockup */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(99,102,241,0.18)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.08)",
            }}
          >
            {/* Browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid rgba(99,102,241,0.1)",
              }}
            >
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
              </div>
              <div
                className="flex-1 text-center text-[10px] font-mono truncate"
                style={{ color: "#475569" }}
              >
                ctxpost.context-x.org → Neuer Post
              </div>
              <div
                className="flex items-center gap-1 text-[9px] font-mono"
                style={{ color: "#4ade80" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Ollama bereit
              </div>
            </div>

            {/* Content Briefing */}
            <div className="p-4 space-y-3">
              <div
                className="rounded-xl p-3 text-[11px]"
                style={{
                  background: "rgba(99,102,241,0.06)",
                  border: "1px solid rgba(99,102,241,0.15)",
                }}
              >
                <div
                  className="text-[9px] font-mono uppercase tracking-wider mb-1.5"
                  style={{ color: "#6366f1" }}
                >
                  CONTENT BRIEFING
                </div>
                <p className="text-slate-300 leading-relaxed text-[10px]">
                  Wir launchen heute unser neues Analytics-Dashboard — live Einblicke,
                  smarte Reports, 10× schneller als vorher 🚀
                </p>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  {["LinkedIn", "Instagram", "X / Twitter"].map((p) => (
                    <span
                      key={p}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium"
                      style={{
                        background: "rgba(99,102,241,0.15)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        color: "#a5b4fc",
                      }}
                    >
                      ✓ {p}
                    </span>
                  ))}
                  <span
                    className="ml-auto px-2.5 py-0.5 rounded-full text-[9px] font-semibold"
                    style={{
                      background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                      color: "white",
                    }}
                  >
                    + Generieren
                  </span>
                </div>
              </div>

              {/* AI generation indicator */}
              <div className="flex items-center gap-2 px-1">
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full animate-bounce"
                      style={{
                        background: "#6366f1",
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-mono" style={{ color: "#6366f1" }}>
                  qwen2.5:32b generiert 3 Posts...
                </span>
              </div>

              {/* Post Previews */}
              <div className="space-y-2">
                {[
                  {
                    platform: "LINKEDIN",
                    color: "#0077b5",
                    bg: "rgba(0,119,181,0.08)",
                    border: "rgba(0,119,181,0.2)",
                    chars: "347 chars · Professional",
                    preview:
                      "Heute ist ein großer Tag für unser Team. Nach monatelanger Entwicklung launchen wir unser neues Analytics-Dashboard...",
                  },
                  {
                    platform: "INSTAGRAM",
                    color: "#e1306c",
                    bg: "rgba(225,48,108,0.08)",
                    border: "rgba(225,48,108,0.2)",
                    chars: "218 chars · 8 Hashtags",
                    preview:
                      "🚀 Big news! Unser Analytics-Dashboard ist live. Alles was du brauchst, auf einen Blick.",
                  },
                  {
                    platform: "X / TWITTER",
                    color: "#94a3b8",
                    bg: "rgba(148,163,184,0.06)",
                    border: "rgba(148,163,184,0.15)",
                    chars: "142 chars · Reply",
                    preview: "We shipped our Analytics Dashboard today. Real-time. Fast. No fluff. Try it →",
                  },
                ].map((post) => (
                  <div
                    key={post.platform}
                    className="rounded-lg p-2.5"
                    style={{
                      background: post.bg,
                      border: `1px solid ${post.border}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[9px] font-bold tracking-wider"
                        style={{ color: post.color }}
                      >
                        {post.platform}
                      </span>
                      <span className="text-[8px]" style={{ color: "#475569" }}>
                        {post.chars}
                      </span>
                    </div>
                    <p className="text-[9px] leading-relaxed" style={{ color: "#94a3b8" }}>
                      {post.preview}
                    </p>
                  </div>
                ))}
              </div>

              {/* Publish row */}
              <div className="flex items-center justify-between pt-1">
                {["Bearbeiten", "Speichern"].map((btn) => (
                  <div
                    key={btn}
                    className="px-3 py-1.5 rounded-lg text-[9px] font-medium"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#64748b",
                    }}
                  >
                    {btn}
                  </div>
                ))}
                <div
                  className="px-3 py-1.5 rounded-lg text-[9px] font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                    color: "white",
                  }}
                >
                  ✓ Alle 3 Posts veröffentlichen
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Trust Signal */}
        <div className="relative z-10 flex items-center gap-3">
          <Shield className="w-4 h-4 text-slate-500" />
          <span className="text-slate-500 text-xs">
            DSGVO-konform · PostgreSQL · End-to-End verschlüsselt
          </span>
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative"
        style={{ background: "#0f172a" }}
      >
        {/* Subtle background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 55%)",
          }}
        />

        {/* Mobile-only Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #6366f1)",
            }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">CtxPost</span>
        </Link>

        {/* Form Container */}
        <div className="w-full max-w-md relative z-10">
          <div
            className="rounded-2xl p-8"
            style={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(99,102,241,0.15)",
              backdropFilter: "blur(20px)",
              boxShadow:
                "0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.05), inset 0 1px 0 rgba(255,255,255,0.03)",
            }}
          >
            {children}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="mt-8 text-slate-700 text-xs text-center relative z-10">
          CtxPost v2.0 · Built with Next.js 16 + Ollama · Local-first AI
        </p>
      </div>
    </div>
  );
}
