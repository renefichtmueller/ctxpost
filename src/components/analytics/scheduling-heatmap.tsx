"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_LABELS = ["0", "3", "6", "9", "12", "15", "18", "21"];

interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

interface SchedulingHeatmapProps {
  data: HeatmapCell[];
}

function getColor(count: number, maxCount: number): string {
  if (maxCount === 0 || count === 0) return "bg-muted/30";
  const intensity = count / maxCount;
  if (intensity >= 0.8) return "bg-primary";
  if (intensity >= 0.6) return "bg-primary/80";
  if (intensity >= 0.4) return "bg-primary/60";
  if (intensity >= 0.2) return "bg-primary/40";
  return "bg-primary/20";
}

export function SchedulingHeatmap({ data }: SchedulingHeatmapProps) {
  const t = useTranslations("analytics");
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const totalPosts = data.reduce((sum, d) => sum + d.count, 0);

  const DAYS = [t("dayMo"), t("dayTu"), t("dayWe"), t("dayTh"), t("dayFr"), t("daySa"), t("daySu")];

  const grid = new Map<string, number>();
  for (const cell of data) {
    grid.set(`${cell.day}-${cell.hour}`, cell.count);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("postingSchedule")}</CardTitle>
        <CardDescription>
          {t("postingScheduleDesc", { count: totalPosts })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalPosts === 0 ? (
          <div className="flex items-center justify-center text-muted-foreground py-12">
            <p className="text-sm">
              {t("noScheduledPostsYet")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Stunden-Labels */}
            <div className="grid gap-[2px]" style={{ gridTemplateColumns: "40px repeat(24, 1fr)" }}>
              <div />
              {HOURS.map((h) => (
                <div key={h} className="text-center">
                  {HOUR_LABELS.includes(String(h)) && (
                    <span className="text-[10px] text-muted-foreground">{h}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Heatmap Grid */}
            <TooltipProvider delayDuration={100}>
              <div className="space-y-[2px]">
                {DAYS.map((day, dayIdx) => (
                  <div
                    key={day}
                    className="grid gap-[2px]"
                    style={{ gridTemplateColumns: "40px repeat(24, 1fr)" }}
                  >
                    <div className="flex items-center text-xs text-muted-foreground font-medium">
                      {day}
                    </div>
                    {HOURS.map((hour) => {
                      const count = grid.get(`${dayIdx}-${hour}`) || 0;

                      return (
                        <Tooltip key={hour}>
                          <TooltipTrigger asChild>
                            <div
                              className={`aspect-square rounded-sm ${getColor(count, maxCount)} transition-colors cursor-default min-h-[12px]`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">{DAYS[dayIdx]}, {hour}:00</p>
                            <p>{count} {count === 1 ? t("postSingular") : t("posts")} {t("scheduledLower")}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </TooltipProvider>

            {/* Legende */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
              <span>{t("legendLess")}</span>
              <div className="flex gap-[2px]">
                <div className="w-3 h-3 rounded-sm bg-muted/30" />
                <div className="w-3 h-3 rounded-sm bg-primary/20" />
                <div className="w-3 h-3 rounded-sm bg-primary/40" />
                <div className="w-3 h-3 rounded-sm bg-primary/60" />
                <div className="w-3 h-3 rounded-sm bg-primary/80" />
                <div className="w-3 h-3 rounded-sm bg-primary" />
              </div>
              <span>{t("legendMorePosts")}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
