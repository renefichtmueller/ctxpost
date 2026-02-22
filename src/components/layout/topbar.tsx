"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { logoutUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, Moon, Sun, Zap } from "lucide-react";
import Link from "next/link";
import { MobileNav } from "./mobile-nav";

export function Topbar() {
  const { data: session } = useSession();
  const t = useTranslations("common");
  const { theme, setTheme } = useTheme();

  const userInitial = (session?.user?.name || session?.user?.email || "U")
    .charAt(0)
    .toUpperCase();
  const userName = session?.user?.name || session?.user?.email || t("profile");

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 py-3"
      style={{
        background: "rgba(8, 14, 26, 0.85)",
        borderBottom: "1px solid rgba(168, 85, 247, 0.1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Mobile Nav */}
      <div className="md:hidden">
        <MobileNav />
      </div>

      {/* Desktop: Breadcrumb/Status */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
          style={{
            background: "rgba(34, 211, 238, 0.06)",
            border: "1px solid rgba(34, 211, 238, 0.12)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span style={{ color: "#22d3ee" }} className="font-mono">SYSTEM ONLINE</span>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl transition-all duration-200 hover:scale-105"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(168, 85, 247, 0.12)",
            color: "#94a3b8",
          }}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Quick New Post */}
        <Link href="/posts/new">
          <Button
            size="sm"
            className="h-9 gap-1.5 text-xs font-semibold text-white border-0 hidden sm:flex"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              boxShadow: "0 0 12px rgba(124, 58, 237, 0.4)",
            }}
          >
            <Zap className="w-3.5 h-3.5" />
            Neuer Post
          </Button>
        </Link>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-xl h-9 px-2.5 transition-all duration-200"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(168, 85, 247, 0.12)",
              }}
            >
              <div
                className="flex items-center justify-center h-6 w-6 rounded-full text-white text-xs font-bold shrink-0"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  boxShadow: "0 0 8px rgba(168, 85, 247, 0.5)"
                }}
              >
                {userInitial}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-slate-300 max-w-[120px] truncate">
                {userName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 rounded-xl"
            style={{
              background: "#0d1424",
              border: "1px solid rgba(168, 85, 247, 0.2)",
            }}
          >
            <DropdownMenuLabel className="text-xs text-slate-300 font-mono">
              {session?.user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator style={{ background: "rgba(168, 85, 247, 0.1)" }} />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 text-slate-300 hover:text-white rounded-lg cursor-pointer">
                <Settings className="h-4 w-4" style={{ color: "#a855f7" }} />
                {t("settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ background: "rgba(168, 85, 247, 0.1)" }} />
            <DropdownMenuItem
              onClick={() => logoutUser()}
              className="flex items-center gap-2 rounded-lg cursor-pointer"
              style={{ color: "#f87171" }}
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
