"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { setLocale } from "@/actions/locale";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

interface LocaleSwitcherProps {
  compact?: boolean;
}

export function LocaleSwitcher({ compact = false }: LocaleSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (newLocale: string) => {
    startTransition(async () => {
      await setLocale(newLocale);
      router.refresh();
    });
  };

  if (compact) {
    return (
      <Select value={locale} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="h-8 w-[52px] px-2 text-xs">
          <Globe className="h-3.5 w-3.5" />
        </SelectTrigger>
        <SelectContent>
          {locales.map((l) => (
            <SelectItem key={l} value={l}>
              <span className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase">{l}</span>
                <span className="text-xs text-muted-foreground">
                  {localeNames[l as Locale]}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={locale} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {localeNames[locale as Locale]}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((l) => (
          <SelectItem key={l} value={l}>
            {localeNames[l as Locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
