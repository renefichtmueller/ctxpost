"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  ChevronRight,
  ChevronLeft,
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
  groupLabel: string;
  items: NavItem[];
};

export function Sidebar() {
  const pathname = usePathname();
  const { isAnyRunning } = useAIAnalysis();
  const t = useTranslations("nav");
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("ctxpost-sidebar-expanded");
      if (stored === "true") setExpanded(true);
    } catch {}
  }, []);

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    try {
      localStorage.setItem("ctxpost-sidebar-expanded", String(next));
    } catch {}
  };

  const navGroups: NavGroup[] = [
    {
      color: "#6366f1",
      groupLabel: "Content",
      items: [
        { href: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
        { href: "/posts/new", icon: PlusCircle, label: t("newPost"), badge: "+", badgeColor: "#22d3ee" },
        { href: "/posts", icon: PenSquare, label: t("posts") },
        { href: "/ideas", icon: Lightbulb, label: t("ideas"), badge: "AI", badgeColor: "#6366f1" },
        { href: "/calendar", icon: Calendar, label: t("calendar") },
        { href: "/queue", icon: ListOrdered, label: t("queue") },
      ],
    },
    {
      color: "#22d3ee",
      groupLabel: "Library",
      items: [
        { href: "/inbox", icon: Inbox, label: t("inbox") },
        { href: "/library", icon: FolderOpen, label: t("library") },
        { href: "/links", icon: Link2, label: t("links") },
      ],
    },
    {
      color: "#f472b6",
      groupLabel: "Analytics",
      items: [
        { href: "/analytics", icon: BarChart3, label: t("analytics") },
        { href: "/ai-insights", icon: Sparkles, label: t("aiInsights") },
        { href: "/ai-models", icon: Bot, label: t("aiModels") },
        { href: "/llm-learning", icon: GraduationCap, label: t("llmLearning") },
      ],
    },
    {
      color: "#fb923c",
      groupLabel: "Account",
      items: [
        { href: "/accounts", icon: Link2, label: t("accounts") },
        { href: "/team", icon: Users, label: t("team") },
        { href: "/settings", icon: Settings, label: t("settings") },
      ],
    },
  ];

  const isExpanded = mounted && expanded;
  const sidebarWidth = isExpanded ? "220px" : "64px";

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className="hidden md:flex flex-col h-screen sticky top-0 overflow-hidden shrink-0"
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          background: "#090f1f",
          borderRight: "1px solid rgba(99, 102, 241, 0.12)",
          transition: "width 280ms cubic-bezier(0.4, 0, 0.2, 1), min-width 280ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Top accent line */}
        <div
          className="h-[2px] w-full shrink-0"
          style={{ background: "linear-gradient(90deg, #4f46e5, #6366f1, #22d3ee, #f472b6)" }}
        />

        {/* Logo */}
        <div
          className="flex items-center py-4 shrink-0 px-3.5"
          style={{ borderBottom: "1px solid rgba(99, 102, 241, 0.08)" }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-110 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                    boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
                  }}
                >
                  <Zap className="w-4 h-4 text-white" />
                </div>
                {isExpanded && (
                  <span
                    className="font-black text-white text-sm truncate"
                    style={{ opacity: 1, transition: "opacity 200ms ease", letterSpacing: "-0.01em" }}
                  >
                    CtxPost
                  </span>
                )}
              </Link>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right">
                <p className="font-bold">CtxPost</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col py-3 gap-0.5 overflow-y-auto overflow-x-hidden">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="w-full flex flex-col">
              {/* Group separator */}
              {groupIdx > 0 && (
                <div className="my-1.5 px-3">
                  {isExpanded ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-[1px] flex-1 rounded-full"
                        style={{ background: `${group.color}20` }}
                      />
                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.12em] shrink-0"
                        style={{ color: group.color + "70" }}
                      >
                        {group.groupLabel}
                      </span>
                      <div
                        className="h-[1px] flex-1 rounded-full"
                        style={{ background: `${group.color}20` }}
                      />
                    </div>
                  ) : (
                    <div
                      className="w-6 h-[1px] mx-auto rounded-full"
                      style={{ background: `${group.color}30` }}
                    />
                  )}
                </div>
              )}

              {/* Items */}
              <div className={cn("flex flex-col gap-0.5", isExpanded ? "px-2" : "items-center px-3")}>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const showSpinner = item.href === "/ai-insights" && isAnyRunning;

                  if (isExpanded) {
                    /* ── EXPANDED: full-width row with icon + label ── */
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group w-full",
                          isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                        )}
                        style={
                          isActive
                            ? {
                                background: "linear-gradient(135deg, rgba(79,70,229,0.3), rgba(99,102,241,0.2))",
                                border: "1px solid rgba(99,102,241,0.3)",
                                boxShadow: "0 0 12px rgba(99,102,241,0.15)",
                              }
                            : { border: "1px solid transparent" }
                        }
                      >
                        {/* Active left indicator */}
                        {isActive && (
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                            style={{ background: "linear-gradient(180deg, #6366f1, #22d3ee)" }}
                          />
                        )}

                        {/* Icon */}
                        <div className="relative shrink-0">
                          {showSpinner ? (
                            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#f472b6" }} />
                          ) : (
                            <item.icon
                              className={cn("h-4 w-4 transition-transform duration-200", !isActive && "group-hover:scale-110")}
                              style={{ color: isActive ? "#6366f1" : undefined }}
                            />
                          )}
                          {showSpinner && (
                            <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
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
                        </div>

                        {/* Label */}
                        <span className="text-sm font-medium truncate flex-1">{item.label}</span>

                        {/* Badge */}
                        {item.badge && !isActive && (
                          <span
                            className="text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full shrink-0"
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
                    );
                  }

                  /* ── COLLAPSED: icon-only with tooltip ── */
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
                                  background: "linear-gradient(135deg, rgba(79,70,229,0.3), rgba(99,102,241,0.2))",
                                  border: "1px solid rgba(99,102,241,0.3)",
                                  boxShadow: "0 0 12px rgba(99,102,241,0.15)",
                                }
                              : { border: "1px solid transparent" }
                          }
                        >
                          {/* Active left indicator */}
                          {isActive && (
                            <div
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                              style={{ background: "linear-gradient(180deg, #6366f1, #22d3ee)" }}
                            />
                          )}

                          {/* Icon */}
                          {showSpinner ? (
                            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#f472b6" }} />
                          ) : (
                            <item.icon
                              className={cn("h-4 w-4 transition-transform duration-200", !isActive && "group-hover:scale-110")}
                              style={{ color: isActive ? "#6366f1" : undefined }}
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

                          {/* Badge dot */}
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
            </div>
          ))}
        </nav>

        {/* Bottom: AI status + toggle */}
        <div
          className="flex flex-col items-center pb-4 pt-3 gap-3 shrink-0"
          style={{ borderTop: "1px solid rgba(99, 102, 241, 0.08)" }}
        >
          {/* AI status */}
          {isAnyRunning ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("flex items-center gap-2", isExpanded ? "px-4 w-full" : "")}>
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                    style={{ background: "rgba(244,114,182,0.1)", border: "1px solid rgba(244,114,182,0.2)" }}
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#f472b6" }} />
                  </div>
                  {isExpanded && (
                    <span className="text-xs font-medium truncate" style={{ color: "#f472b6" }}>
                      KI analysiert…
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent side="right">
                  <p>KI analysiert…</p>
                </TooltipContent>
              )}
            </Tooltip>
          ) : (
            <div className={cn("flex items-center gap-2", isExpanded ? "px-4 w-full" : "")}>
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: "#34d399", boxShadow: "0 0 6px #34d399" }}
              />
              {isExpanded && (
                <span className="text-xs" style={{ color: "#34d399" }}>Online</span>
              )}
            </div>
          )}

          {/* Toggle button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleExpanded}
                className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 hover:scale-110"
                style={{
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  color: "#6366f1",
                }}
                aria-label={isExpanded ? "Sidebar einklappen" : "Sidebar ausklappen"}
              >
                {isExpanded ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <p>{isExpanded ? "Einklappen" : "Ausklappen"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
