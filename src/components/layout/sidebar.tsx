"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PenSquare,
  PlusCircle,
  Calendar,
  ListOrdered,
  BarChart3,
  Sparkles,
  Link2,
  Settings,
  Bot,
  Loader2,
  GraduationCap,
  FolderOpen,
  Lightbulb,
  Inbox,
  Users,
  Zap,
  ChevronRight,
} from "lucide-react";
import { useAIAnalysis } from "@/contexts/ai-analysis-context";
import { LocaleSwitcher } from "@/components/locale-switcher";

type NavKey =
  | "dashboard" | "posts" | "newPost" | "ideas"
  | "calendar" | "queue" | "inbox" | "library"
  | "links" | "analytics" | "aiInsights" | "aiModels"
  | "llmLearning" | "accounts" | "team" | "settings";

type NavItem = {
  href: string;
  key: NavKey;
  icon: typeof LayoutDashboard;
  badge?: string;
  badgeColor?: string;
};

type NavSection = {
  label: string;
  color: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: "Content",
    color: "#a855f7",
    items: [
      { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
      { href: "/posts", key: "posts", icon: PenSquare },
      { href: "/posts/new", key: "newPost", icon: PlusCircle, badge: "NEW", badgeColor: "#22d3ee" },
      { href: "/ideas", key: "ideas", icon: Lightbulb, badge: "AI", badgeColor: "#a855f7" },
      { href: "/calendar", key: "calendar", icon: Calendar },
      { href: "/queue", key: "queue", icon: ListOrdered },
    ],
  },
  {
    label: "Media",
    color: "#22d3ee",
    items: [
      { href: "/inbox", key: "inbox", icon: Inbox },
      { href: "/library", key: "library", icon: FolderOpen },
      { href: "/links", key: "links", icon: Link2 },
    ],
  },
  {
    label: "Intelligence",
    color: "#f472b6",
    items: [
      { href: "/analytics", key: "analytics", icon: BarChart3 },
      { href: "/ai-insights", key: "aiInsights", icon: Sparkles, badge: "AI", badgeColor: "#f472b6" },
      { href: "/ai-models", key: "aiModels", icon: Bot },
      { href: "/llm-learning", key: "llmLearning", icon: GraduationCap },
    ],
  },
  {
    label: "Management",
    color: "#fb923c",
    items: [
      { href: "/accounts", key: "accounts", icon: Link2 },
      { href: "/team", key: "team", icon: Users },
      { href: "/settings", key: "settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAnyRunning } = useAIAnalysis();
  const t = useTranslations("nav");

  return (
    <aside
      className="hidden md:flex flex-col w-64 h-screen sticky top-0 overflow-hidden"
      style={{
        background: "#080e1a",
        borderRight: "1px solid rgba(168, 85, 247, 0.1)",
      }}
    >
      {/* Top accent line */}
      <div className="h-[2px] w-full shrink-0"
        style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7, #22d3ee, #f472b6)" }}
      />

      {/* Brand Logo */}
      <div className="p-5 shrink-0" style={{ borderBottom: "1px solid rgba(168, 85, 247, 0.08)" }}>
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              boxShadow: "0 0 16px rgba(168, 85, 247, 0.4)"
            }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight">CtxPost</span>
            <span className="block text-[9px] font-mono tracking-widest uppercase" style={{ color: "#22d3ee" }}>
              // AI-POWERED
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            {/* Section Label */}
            <div className="flex items-center gap-2 px-2 mb-1.5">
              <div className="w-1 h-3 rounded-full" style={{ background: section.color }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: section.color + "99" }}>
                {section.label}
              </p>
            </div>

            {/* Nav Items */}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const showSpinner = item.href === "/ai-insights" && isAnyRunning;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                      isActive
                        ? "text-white"
                        : "text-slate-300 hover:text-slate-200"
                    )}
                    style={isActive ? {
                      background: "linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(168, 85, 247, 0.15))",
                      border: "1px solid rgba(168, 85, 247, 0.25)",
                      boxShadow: "0 0 12px rgba(168, 85, 247, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                    } : {
                      border: "1px solid transparent",
                    }}
                  >
                    {/* Active left indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                        style={{ background: "linear-gradient(180deg, #a855f7, #22d3ee)" }}
                      />
                    )}

                    {/* Icon */}
                    <span
                      className={cn(
                        "shrink-0 transition-colors",
                        isActive ? "" : "group-hover:scale-110 transition-transform duration-200"
                      )}
                      style={{ color: isActive ? "#a855f7" : undefined }}
                    >
                      {showSpinner ? (
                        <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#f472b6" }} />
                      ) : (
                        <item.icon className="h-4 w-4" />
                      )}
                    </span>

                    {/* Label */}
                    <span className="flex-1 truncate">{t(item.key)}</span>

                    {/* Badge */}
                    {item.badge && !isActive && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: item.badgeColor + "20",
                          color: item.badgeColor,
                          border: `1px solid ${item.badgeColor}40`,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* AI Running Pulse */}
                    {showSpinner && !isActive && (
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ background: "#f472b6" }}
                        />
                        <span className="relative inline-flex rounded-full h-2 w-2"
                          style={{ background: "#f472b6" }}
                        />
                      </span>
                    )}

                    {/* Hover arrow */}
                    {!isActive && (
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: Locale + Status */}
      <div className="p-3 space-y-2 shrink-0" style={{ borderTop: "1px solid rgba(168, 85, 247, 0.08)" }}>
        {/* AI Status */}
        {isAnyRunning && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{
              background: "rgba(244, 114, 182, 0.08)",
              border: "1px solid rgba(244, 114, 182, 0.15)",
              color: "#f472b6"
            }}
          >
            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
            <span>KI analysiert...</span>
          </div>
        )}
        <LocaleSwitcher compact />
      </div>
    </aside>
  );
}
