"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
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
} from "lucide-react";
import { useAIAnalysis } from "@/contexts/ai-analysis-context";
import { useTranslations } from "next-intl";

type NavItem = {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: string;
  badgeColor?: string;
};

type NavGroup = {
  color: string;
  items: NavItem[];
};

export function Sidebar() {
  const pathname = usePathname();
  const { isAnyRunning } = useAIAnalysis();
  const t = useTranslations("nav");

  const navGroups: NavGroup[] = [
    {
      color: "#a855f7",
      items: [
        { href: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
        { href: "/posts/new", icon: PlusCircle, label: t("newPost"), badge: "+", badgeColor: "#22d3ee" },
        { href: "/posts", icon: PenSquare, label: t("posts") },
        { href: "/ideas", icon: Lightbulb, label: t("ideas"), badge: "AI", badgeColor: "#a855f7" },
        { href: "/calendar", icon: Calendar, label: t("calendar") },
        { href: "/queue", icon: ListOrdered, label: t("queue") },
      ],
    },
    {
      color: "#22d3ee",
      items: [
        { href: "/inbox", icon: Inbox, label: t("inbox") },
        { href: "/library", icon: FolderOpen, label: t("library") },
        { href: "/links", icon: Link2, label: t("links") },
      ],
    },
    {
      color: "#f472b6",
      items: [
        { href: "/analytics", icon: BarChart3, label: t("analytics") },
        { href: "/ai-insights", icon: Sparkles, label: t("aiInsights") },
        { href: "/ai-models", icon: Bot, label: t("aiModels") },
        { href: "/llm-learning", icon: GraduationCap, label: t("llmLearning") },
      ],
    },
    {
      color: "#fb923c",
      items: [
        { href: "/accounts", icon: Link2, label: t("accounts") },
        { href: "/team", icon: Users, label: t("team") },
        { href: "/settings", icon: Settings, label: t("settings") },
      ],
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className="hidden md:flex flex-col w-16 h-screen sticky top-0 overflow-hidden shrink-0"
        style={{
          background: "#080e1a",
          borderRight: "1px solid rgba(168, 85, 247, 0.12)",
        }}
      >
        {/* Top accent line */}
        <div
          className="h-[2px] w-full shrink-0"
          style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7, #22d3ee, #f472b6)" }}
        />

        {/* Logo Icon */}
        <div className="flex items-center justify-center py-4 shrink-0" style={{ borderBottom: "1px solid rgba(168, 85, 247, 0.08)" }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/dashboard">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    boxShadow: "0 0 16px rgba(168, 85, 247, 0.4)",
                  }}
                >
                  <Zap className="w-4 h-4 text-white" />
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-bold">CtxPost</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 flex flex-col items-center py-3 gap-1 overflow-y-auto">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="w-full flex flex-col items-center gap-0.5">
              {/* Group divider (except first) */}
              {groupIdx > 0 && (
                <div
                  className="w-6 h-[1px] my-2 rounded-full"
                  style={{ background: `${group.color}30` }}
                />
              )}

              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const showSpinner = item.href === "/ai-insights" && isAnyRunning;

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group",
                          isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                        )}
                        style={
                          isActive
                            ? {
                                background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))",
                                border: "1px solid rgba(168,85,247,0.3)",
                                boxShadow: "0 0 12px rgba(168,85,247,0.15)",
                              }
                            : { border: "1px solid transparent" }
                        }
                      >
                        {/* Active left indicator */}
                        {isActive && (
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                            style={{ background: "linear-gradient(180deg, #a855f7, #22d3ee)" }}
                          />
                        )}

                        {/* Icon */}
                        {showSpinner ? (
                          <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#f472b6" }} />
                        ) : (
                          <item.icon
                            className={cn("h-4 w-4 transition-transform duration-200", !isActive && "group-hover:scale-110")}
                            style={{ color: isActive ? "#a855f7" : undefined }}
                          />
                        )}

                        {/* AI running pulse */}
                        {showSpinner && (
                          <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                            <span
                              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                              style={{ background: "#f472b6" }}
                            />
                            <span
                              className="relative inline-flex rounded-full h-1.5 w-1.5"
                              style={{ background: "#f472b6" }}
                            />
                          </span>
                        )}

                        {/* Badge dot (NEW/AI) */}
                        {item.badge && !isActive && (
                          <span
                            className="absolute top-1 right-1 text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full"
                            style={{
                              background: item.badgeColor + "25",
                              color: item.badgeColor,
                              border: `1px solid ${item.badgeColor}50`,
                            }}
                          >
                            {item.badge === "AI" ? "✦" : item.badge}
                          </span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom: AI status dot */}
        <div className="flex flex-col items-center pb-4 shrink-0" style={{ borderTop: "1px solid rgba(168, 85, 247, 0.08)" }}>
          {isAnyRunning ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-3 flex items-center justify-center w-8 h-8 rounded-full" style={{ background: "rgba(244,114,182,0.1)", border: "1px solid rgba(244,114,182,0.2)" }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#f472b6" }} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>KI analysiert...</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="mt-3 w-1.5 h-1.5 rounded-full" style={{ background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
