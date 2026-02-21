"use server";

import { auth } from "@/lib/auth";
import { saveFeedback } from "@/lib/feedback";
import type { AIInsightType, FeedbackRating } from "@prisma/client";

export async function submitFeedback(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "notAuthenticated" };

  const insightType = formData.get("insightType") as AIInsightType;
  const rating = formData.get("rating") as FeedbackRating;
  const originalOutput = formData.get("originalOutput") as string;
  const editedOutput = formData.get("editedOutput") as string | null;
  const modelUsed = formData.get("modelUsed") as string | null;
  const inputContextStr = formData.get("inputContext") as string | null;

  if (!insightType || !rating || !originalOutput) {
    return { error: "missingFields" };
  }

  let inputContext: Record<string, unknown> | undefined;
  if (inputContextStr) {
    try {
      inputContext = JSON.parse(inputContextStr);
    } catch {
      // ignore parse errors
    }
  }

  await saveFeedback({
    userId: session.user.id,
    insightType,
    rating,
    originalOutput,
    editedOutput: editedOutput || undefined,
    modelUsed: modelUsed || undefined,
    inputContext,
  });

  return { success: true };
}
