"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { submitFeedback } from "@/actions/feedback";
import type { AIInsightType } from "@prisma/client";

interface FeedbackButtonsProps {
  insightType: AIInsightType;
  originalOutput: string;
  modelUsed?: string;
  inputContext?: Record<string, unknown>;
  className?: string;
}

export function FeedbackButtons({
  insightType,
  originalOutput,
  modelUsed,
  inputContext,
  className = "",
}: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState<"GOOD" | "BAD" | null>(null);
  const t = useTranslations("learning");

  const handleFeedback = async (rating: "GOOD" | "BAD") => {
    const formData = new FormData();
    formData.set("insightType", insightType);
    formData.set("rating", rating);
    formData.set("originalOutput", originalOutput);
    if (modelUsed) formData.set("modelUsed", modelUsed);
    if (inputContext) formData.set("inputContext", JSON.stringify(inputContext));

    const result = await submitFeedback(formData);
    if (result.success) {
      setSubmitted(rating);
    }
  };

  if (submitted) {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
        <Check className="h-3.5 w-3.5 text-green-500" />
        <span>{submitted === "GOOD" ? t("feedbackGood") : t("feedbackBad")}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback("GOOD")}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-green-600"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback("BAD")}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
