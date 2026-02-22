import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  BarChart3,
  Sparkles,
  Brain,
  Zap,
  Users,
  Shield,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "#060b14", color: "#e2e8f0" }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow orbs */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "-20%",
          left: "10%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          bottom: "10%",
          right: "-10%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* ── HEADER ── */}
      <header
        className="relative z-50 container mx-auto px-6 py-5 flex justify-between items-center"
        style={{ borderBottom: "1px solid rgba(168,85,247,0.1)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center h-9 w-9 rounded-xl"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 0 20px rgba(168,85,247,0.4)" }}
          >
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">CtxPost</span>
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
            style={{ color: "#22d3ee", background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)" }}
          >
            // AI-POWERED
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm"
              style={{ color: "#94a3b8" }}
            >
              {t("login")}
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className="text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                border: "none",
                boxShadow: "0 0 20px rgba(168,85,247,0.3)",
              }}
            >
              {t("register")}
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <main className="relative z-10">
        <section className="container mx-auto px-6 pt-24 pb-20 text-center">
          {/* Status chip */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8"
            style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#34d399" }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#34d399" }} />
            </span>
            v2.0 — Fully Autonomous Social Media OS
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            <span className="text-white">Your Social Media</span>
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #22d3ee 50%, #f472b6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Runs on AI.
            </span>
          </h1>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: "#94a3b8" }}>
            {t("heroDesc")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="text-base font-bold px-8 h-13"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  border: "none",
                  boxShadow: "0 0 40px rgba(168,85,247,0.4)",
                }}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {t("cta")}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="text-base font-semibold px-8 h-13"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(168,85,247,0.25)",
                  color: "#c4b5fd",
                }}
              >
                {t("login")} →
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 flex flex-wrap justify-center gap-8">
            {[
              { value: "15+", label: "KI-Modelle lokal" },
              { value: "5", label: "Plattformen" },
              { value: "100%", label: "Self-hosted" },
              { value: "∞", label: "Posts automatisiert" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black" style={{ color: "#a855f7" }}>{stat.value}</div>
                <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TERMINAL MOCKUP ── */}
        <section className="container mx-auto px-6 pb-24">
          <div
            className="max-w-3xl mx-auto rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(168,85,247,0.2)", boxShadow: "0 0 60px rgba(168,85,247,0.1)" }}
          >
            {/* Terminal header */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ background: "#0d1424", borderBottom: "1px solid rgba(168,85,247,0.1)" }}
            >
              <div className="h-3 w-3 rounded-full" style={{ background: "#ef4444" }} />
              <div className="h-3 w-3 rounded-full" style={{ background: "#f59e0b" }} />
              <div className="h-3 w-3 rounded-full" style={{ background: "#22c55e" }} />
              <span className="ml-3 text-xs font-mono" style={{ color: "#94a3b8" }}>ctxpost — ai@system</span>
            </div>
            {/* Terminal body */}
            <div
              className="p-6 font-mono text-sm space-y-2"
              style={{ background: "#060b14" }}
            >
              <div><span style={{ color: "#a855f7" }}>$</span> <span style={{ color: "#22d3ee" }}>ctxpost</span> <span className="text-white">generate --platform instagram,linkedin --ai ollama</span></div>
              <div style={{ color: "#94a3b8" }}>✓ Connecting to Ollama (qwen2.5:32b)...</div>
              <div style={{ color: "#34d399" }}>✓ Trends analyzed: #AI #Marketing #Growth</div>
              <div style={{ color: "#34d399" }}>✓ Brand voice applied: Professional, Engaging</div>
              <div style={{ color: "#34d399" }}>✓ Post generated for 2 platforms</div>
              <div style={{ color: "#94a3b8" }}>✓ Optimal schedule: Tue 09:30, Thu 17:00</div>
              <div><span style={{ color: "#a855f7" }}>$</span> <span style={{ color: "#22d3ee" }}>ctxpost</span> <span className="text-white">publish --approve --schedule</span></div>
              <div style={{ color: "#34d399" }}>✓ 2 posts scheduled successfully</div>
              <div className="flex items-center gap-2">
                <span style={{ color: "#a855f7" }}>$</span>
                <span className="inline-block w-2 h-4 animate-pulse" style={{ background: "#a855f7" }} />
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <p className="text-xs font-mono font-bold mb-3" style={{ color: "#a855f7" }}>// FEATURES</p>
            <h2 className="text-4xl font-black text-white mb-4">Alles was du brauchst.</h2>
            <p className="text-lg" style={{ color: "#94a3b8" }}>Lokal. Schnell. Vollständig unter deiner Kontrolle.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {[
              {
                icon: Brain,
                color: "#a855f7",
                bg: "rgba(168,85,247,0.08)",
                border: "rgba(168,85,247,0.2)",
                title: t("feature2Title"),
                desc: t("feature2Desc"),
                tag: "LOCAL AI",
              },
              {
                icon: Calendar,
                color: "#22d3ee",
                bg: "rgba(34,211,238,0.08)",
                border: "rgba(34,211,238,0.2)",
                title: t("feature1Title"),
                desc: t("feature1Desc"),
                tag: "SCHEDULER",
              },
              {
                icon: BarChart3,
                color: "#f472b6",
                bg: "rgba(244,114,182,0.08)",
                border: "rgba(244,114,182,0.2)",
                title: t("feature3Title"),
                desc: t("feature3Desc"),
                tag: "ANALYTICS",
              },
              {
                icon: TrendingUp,
                color: "#34d399",
                bg: "rgba(52,211,153,0.08)",
                border: "rgba(52,211,153,0.2)",
                title: "Trend Intelligence",
                desc: "Echtzeit-Trends von Google & RSS-Feeds direkt in deine Content-Planung integriert.",
                tag: "TRENDS",
              },
              {
                icon: Users,
                color: "#fb923c",
                bg: "rgba(251,146,60,0.08)",
                border: "rgba(251,146,60,0.2)",
                title: "Team Workflow",
                desc: "Scripter, Moderator, Admin – jeder hat seine Rolle. Approval-Flow ohne Chaos.",
                tag: "TEAMS",
              },
              {
                icon: ImageIcon,
                color: "#818cf8",
                bg: "rgba(129,140,248,0.08)",
                border: "rgba(129,140,248,0.2)",
                title: "AI Image Generation",
                desc: "Stable Diffusion lokal oder per API. Bilder direkt im Post-Editor generieren.",
                tag: "IMAGES",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl space-y-4 transition-all hover:scale-[1.02]"
                style={{ background: f.bg, border: `1px solid ${f.border}` }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-center justify-center h-11 w-11 rounded-xl"
                    style={{ background: `${f.bg}`, border: `1px solid ${f.border}` }}
                  >
                    <f.icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <span
                    className="text-[9px] font-mono font-bold px-2 py-1 rounded"
                    style={{ color: f.color, background: `${f.bg}`, border: `1px solid ${f.border}` }}
                  >
                    {f.tag}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── WHY LOCAL AI ── */}
        <section className="container mx-auto px-6 py-20">
          <div
            className="max-w-5xl mx-auto rounded-3xl p-10 md:p-16 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(34,211,238,0.08) 100%)", border: "1px solid rgba(168,85,247,0.2)" }}
          >
            {/* Glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(168,85,247,0.12) 0%, transparent 60%)" }}
            />
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-xs font-mono font-bold mb-3" style={{ color: "#22d3ee" }}>// WHY CTXPOST</p>
                <h2 className="text-3xl font-black text-white mb-4 leading-tight">
                  Deine KI. Deine Daten.<br />Dein Server.
                </h2>
                <p className="text-base leading-relaxed mb-6" style={{ color: "#94a3b8" }}>
                  Keine Cloud-Abhängigkeit. Keine Datenweitergabe. Dein Ollama läuft lokal –
                  15+ Modelle, kostenlos, 24/7. CtxPost ist dein persönliches Social Media OS.
                </p>
                <Link href="/register">
                  <Button
                    size="lg"
                    className="font-bold"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                      border: "none",
                      boxShadow: "0 0 30px rgba(168,85,247,0.4)",
                    }}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Jetzt starten
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Shield, text: "100% Self-hosted – keine Datenweitergabe", color: "#34d399" },
                  { icon: Brain, text: "15+ Ollama-Modelle lokal (Qwen, Llama, Mistral...)", color: "#a855f7" },
                  { icon: Zap, text: "Keine monatlichen KI-Kosten", color: "#22d3ee" },
                  { icon: MessageSquare, text: "Vollständige API-Kontrolle (Facebook, LinkedIn, X)", color: "#f472b6" },
                  { icon: Terminal, text: "Open Source / hackable", color: "#fb923c" },
                  { icon: CheckCircle2, text: "Mehrsprachig (DE/EN/FR/ES/PT)", color: "#818cf8" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 shrink-0" style={{ color: item.color }} />
                    <span className="text-sm" style={{ color: "#e2e8f0" }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="container mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Bereit für{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #a855f7, #22d3ee)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              autonomes
            </span>{" "}
            Posting?
          </h2>
          <p className="text-lg mb-10" style={{ color: "#94a3b8" }}>
            Starte kostenlos. Keine Kreditkarte. Keine Cloud.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="text-base font-bold px-12 h-14"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7, #22d3ee)",
                border: "none",
                boxShadow: "0 0 60px rgba(168,85,247,0.35)",
              }}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {t("cta")}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer
        className="container mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop: "1px solid rgba(168,85,247,0.1)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center h-7 w-7 rounded-lg"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-sm text-white">CtxPost</span>
        </div>
        <p className="text-xs" style={{ color: "#94a3b8" }}>
          CtxPost &mdash; {t("footer")}
        </p>
        <div className="flex gap-4 text-xs" style={{ color: "#94a3b8" }}>
          <Link href="/login" className="hover:text-white transition-colors">{t("login")}</Link>
          <Link href="/register" className="hover:text-white transition-colors">{t("register")}</Link>
        </div>
      </footer>
    </div>
  );
}
