"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  LayoutDashboard,
  PenSquare,
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
} from "lucide-react";
import { useAIAnalysis } from "@/contexts/ai-analysis-context";
import { LocaleSwitcher } from "@/components/locale-switcher";

type NavKey = "dashboard" | "posts" | "newPost" | "ideas" | "calendar" | "queue" | "inbox" | "library" | "links" | "analytics" | "aiInsights" | "aiModels" | "llmLearning" | "accounts" | "team" | "settings";

const navItems: Array<{ href: string; key: NavKey; icon: typeof LayoutDashboard }> = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/posts", key: "posts", icon: PenSquare },
  { href: "/posts/new", key: "newPost", icon: PenSquare },
  { href: "/ideas", key: "ideas", icon: Lightbulb },
  { href: "/calendar", key: "calendar", icon: Calendar },
  { href: "/queue", key: "queue", icon: ListOrdered },
  { href: "/inbox", key: "inbox", icon: Inbox },
  { href: "/library", key: "library", icon: FolderOpen },
  { href: "/links", key: "links", icon: Link2 },
  { href: "/analytics", key: "analytics", icon: BarChart3 },
  { href: "/ai-insights", key: "aiInsights", icon: Sparkles },
  { href: "/ai-models", key: "aiModels", icon: Bot },
  { href: "/llm-learning", key: "llmLearning", icon: GraduationCap },
  { href: "/accounts", key: "accounts", icon: Link2 },
  { href: "/team", key: "team", icon: Users },
  { href: "/settings", key: "settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isAnyRunning } = useAIAnalysis();
  const t = useTranslations("nav");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Menu className="h-5 w-5" />
          {isAnyRunning && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="p-6 border-b">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <Image src="/logo.svg" alt="Social Scheduler" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-bold">Social Scheduler</span>
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const showSpinner = item.href === "/ai-insights" && isAnyRunning;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {showSpinner ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <item.icon className="h-4 w-4" />
                )}
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <LocaleSwitcher compact />
        </div>
      </SheetContent>
    </Sheet>
  );
}
