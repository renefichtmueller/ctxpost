/**
 * AI Feedback System
 * Collects user feedback on AI-generated content for training pipeline.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { AIInsightType, FeedbackRating } from "@prisma/client";

interface FeedbackInput {
  userId: string;
  insightType: AIInsightType;
  rating: FeedbackRating;
  originalOutput: string;
  editedOutput?: string;
  modelUsed?: string;
  inputContext?: Record<string, unknown>;
}

/**
 * Save user feedback on AI-generated content
 */
export async function saveFeedback(input: FeedbackInput) {
  return prisma.aIFeedback.create({
    data: {
      userId: input.userId,
      insightType: input.insightType,
      rating: input.rating,
      originalOutput: input.originalOutput,
      editedOutput: input.editedOutput || null,
      modelUsed: input.modelUsed || null,
      inputContext: input.inputContext
        ? (input.inputContext as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  });
}

/**
 * Get feedback statistics for a user
 */
export async function getFeedbackStats(userId: string) {
  const [total, good, bad, edited] = await Promise.all([
    prisma.aIFeedback.count({ where: { userId } }),
    prisma.aIFeedback.count({ where: { userId, rating: "GOOD" } }),
    prisma.aIFeedback.count({ where: { userId, rating: "BAD" } }),
    prisma.aIFeedback.count({ where: { userId, rating: "EDITED" } }),
  ]);

  return { total, good, bad, edited, approvalRate: total > 0 ? good / total : 0 };
}

/**
 * Export positive feedback as training data (JSONL format)
 * Returns an array of ChatML-formatted training examples
 */
export async function exportFeedbackAsTrainingData(userId?: string) {
  const where = userId ? { userId, rating: { in: ["GOOD" as const, "EDITED" as const] } } : { rating: { in: ["GOOD" as const, "EDITED" as const] } };

  const feedback = await prisma.aIFeedback.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  return feedback.map((fb) => {
    const inputCtx = fb.inputContext as Record<string, unknown> | null;
    const systemPrompt = (inputCtx?.systemPrompt as string) || "You are a social media marketing assistant.";
    const userMessage = (inputCtx?.userMessage as string) || "";
    // Use edited version if available (higher quality), otherwise original
    const assistantResponse = fb.editedOutput || fb.originalOutput;

    return {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
        { role: "assistant", content: assistantResponse },
      ],
      metadata: {
        task_type: fb.insightType,
        rating: fb.rating,
        model: fb.modelUsed,
        source: "user_feedback",
      },
    };
  });
}
