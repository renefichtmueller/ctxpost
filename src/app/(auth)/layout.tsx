import Link from "next/link";
import { Zap, Brain, BarChart3, Calendar, Shield, Sparkles } from "lucide-react";

const features = [
  { icon: Brain, label: "KI-Content-Erstellung", desc: "15+ LLM-Modelle lokal & cloud" },
  { icon: Calendar, label: "Smart Scheduling", desc: "Optimale Posting-Zeiten via AI" },
  { icon: BarChart3, label: "Deep Analytics", desc: "Echtzeit-Performance-Analyse" },
  { icon: Sparkles, label: "Multi-Platform", desc: "X, LinkedIn, Instagram & mehr" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex dark" style={{ colorScheme: "dark" }}>
      {/* ── Left Panel: Cinematic Brand Side ── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: "linear-gradient(135deg, #060b14 0%, #0d1424 40%, #130a2e 70%, #060b14 100%)"
        }}
      >
        {/* Grid Background */}
        <div className="absolute inset-0 bg-grid opacity-100" />

        {/* Radial Glow Orbs */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
        />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }}
        />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #ec4899 0%, transparent 70%)" }}
        />

        {/* Top: Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-purple">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight">CtxPost</span>
              <span className="block text-[10px] mono-tag" style={{ color: "#22d3ee" }}>v2.0 // AI-POWERED</span>
            </div>
          </Link>
        </div>

        {/* Center: Main Headline */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(168, 85, 247, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                color: "#c084fc"
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              KI-gestützte Social Media Platform
            </div>

            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              Dein Content.<br />
              <span style={{
                background: "linear-gradient(135deg, #a855f7, #22d3ee)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>
                Amplified by AI.
              </span>
            </h1>

            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Erstelle, plane und analysiere Social-Media-Beiträge mit lokaler KI-Power –
              ohne Cloud-Zwang, mit maximaler Kontrolle.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature) => (
              <div
                key={feature.label}
                className="p-4 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(168, 85, 247, 0.1)",
                }}
              >
                <feature.icon className="w-5 h-5 mb-2" style={{ color: "#a855f7" }} />
                <p className="text-white text-sm font-semibold">{feature.label}</p>
                <p className="text-slate-300 text-xs mt-0.5">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Trust Signal */}
        <div className="relative z-10 flex items-center gap-3">
          <Shield className="w-4 h-4 text-slate-300" />
          <span className="text-slate-300 text-xs">
            DSGVO-konform · PostgreSQL · End-to-End verschlüsselt
          </span>
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative"
        style={{ background: "#060b14" }}
      >
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.08) 0%, transparent 60%)"
          }}
        />

        {/* Mobile-only Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">CtxPost</span>
        </Link>

        {/* Form Container */}
        <div className="w-full max-w-md relative z-10">
          <div className="rounded-2xl p-8"
            style={{
              background: "rgba(13, 20, 36, 0.9)",
              border: "1px solid rgba(168, 85, 247, 0.15)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(168, 85, 247, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.03)"
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
