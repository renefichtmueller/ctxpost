"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, CheckCircle2 } from "lucide-react";
import { COMMON_TIMEZONES } from "@/lib/constants";
import { updateTimezone } from "@/actions/timezone";

interface TimezoneFormProps {
  currentTimezone: string;
}

export function TimezoneForm({ currentTimezone }: TimezoneFormProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tAi = useTranslations("ai");
  const locale = useLocale();
  const [timezone, setTimezone] = useState(currentTimezone);
  const [currentTime, setCurrentTime] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Update the displayed time every second
  useEffect(() => {
    const formatTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(now);
      setCurrentTime(formatted);
    };

    formatTime();
    const interval = setInterval(formatTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    setSaved(false);

    startTransition(async () => {
      const result = await updateTimezone(value);
      if (!result?.error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t("timezone")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select value={timezone} onValueChange={handleTimezoneChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("timezoneSelect")} />
            </SelectTrigger>
            <SelectContent>
              {COMMON_TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(saved || isPending) && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              {isPending ? (
                <span>{tAi("saving")}</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{tAi("saved")}</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-lg border p-3 bg-muted/50">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t("currentTime")}</span>
          <span className="text-sm font-medium">{currentTime}</span>
        </div>
      </CardContent>
    </Card>
  );
}
