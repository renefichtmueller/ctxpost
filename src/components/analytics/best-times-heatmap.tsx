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
  day: number; // 0=Mo, 6=So
  hour: number; // 0-23
  value: number; // Engagement-Wert
  posts: number; // Anzahl Posts
}

interface BestTimesHeatmapProps {
  data: HeatmapCell[];
}

function getColor(value: number, maxValue: number): string {
  if (maxValue === 0 || value === 0) return "bg-muted/30";
  const intensity = value / maxValue;
  if (intensity >= 0.8) return "bg-green-500";
  if (intensity >= 0.6) return "bg-green-400";
  if (intensity >= 0.4) return "bg-yellow-400";
  if (intensity >= 0.2) return "bg-orange-300";
  return "bg-orange-200/60";
}

export function BestTimesHeatmap({ data }: BestTimesHeatmapProps) {
  const t = useTranslations("analytics");
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const DAYS = [t("dayMo"), t("dayTu"), t("dayWe"), t("dayTh"), t("dayFr"), t("daySa"), t("daySu")];

  // Erstelle ein 7x24 Grid
  const grid: Map<string, HeatmapCell> = new Map();
  for (const cell of data) {
    grid.set(`${cell.day}-${cell.hour}`, cell);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("bestPostingTimes")}</CardTitle>
        <CardDescription>
          {t("bestPostingTimesDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center text-muted-foreground py-12">
            <p className="text-sm">
              {t("noBestTimesData")}
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
                      const cell = grid.get(`${dayIdx}-${hour}`);
                      const value = cell?.value || 0;
                      const posts = cell?.posts || 0;

                      return (
                        <Tooltip key={hour}>
                          <TooltipTrigger asChild>
                            <div
                              className={`aspect-square rounded-sm ${getColor(value, maxValue)} transition-colors cursor-default min-h-[12px]`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">{DAYS[dayIdx]}, {hour}:00</p>
                            <p>{t("engagement")}: {value.toFixed(1)}</p>
                            <p>{t("posts")}: {posts}</p>
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
                <div className="w-3 h-3 rounded-sm bg-orange-200/60" />
                <div className="w-3 h-3 rounded-sm bg-orange-300" />
                <div className="w-3 h-3 rounded-sm bg-yellow-400" />
                <div className="w-3 h-3 rounded-sm bg-green-400" />
                <div className="w-3 h-3 rounded-sm bg-green-500" />
              </div>
              <span>{t("legendMoreEngagement")}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
