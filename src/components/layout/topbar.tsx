"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { logoutUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { MobileNav } from "./mobile-nav";

export function Topbar() {
  const { data: session } = useSession();
  const t = useTranslations("common");

  return (
    <header className="border-b bg-card px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="md:hidden">
        <MobileNav />
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {session?.user?.name || session?.user?.email || t("profile")}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t("settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logoutUser()}
              className="flex items-center gap-2 text-destructive"
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
