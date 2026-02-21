import type { AITaskType } from "./ai-provider";

export interface ModelRecommendation {
  model: string;
  reasonKey: string;
  tier: "recommended" | "premium" | "budget";
}

export const MODEL_RECOMMENDATIONS: Record<AITaskType, ModelRecommendation[]> = {
  text: [
    {
      model: "qwen2.5:32b",
      reasonKey: "reasonQwen32bText",
      tier: "recommended",
    },
    {
      model: "llama3.1:70b",
      reasonKey: "reasonLlama70bText",
      tier: "premium",
    },
    {
      model: "qwen2.5:7b",
      reasonKey: "reasonQwen7bText",
      tier: "budget",
    },
  ],
  analysis: [
    {
      model: "qwen2.5:32b",
      reasonKey: "reasonQwen32bAnalysis",
      tier: "recommended",
    },
    {
      model: "qwen2.5:7b",
      reasonKey: "reasonQwen7bAnalysis",
      tier: "budget",
    },
  ],
  image: [
    {
      model: "llava:13b",
      reasonKey: "reasonLlava13b",
      tier: "recommended",
    },
    {
      model: "llava:7b",
      reasonKey: "reasonLlava7b",
      tier: "budget",
    },
  ],
};

const TIER_LABEL_KEYS: Record<string, string> = {
  recommended: "tierRecommended",
  premium: "tierPremium",
  budget: "tierBudget",
};

export function getTierLabelKey(tier: string): string {
  return TIER_LABEL_KEYS[tier] || tier;
}

export function getRecommendationForModel(
  taskType: AITaskType,
  modelName: string
): ModelRecommendation | undefined {
  return MODEL_RECOMMENDATIONS[taskType]?.find((r) => r.model === modelName);
}

export function isRecommendedModel(
  taskType: AITaskType,
  modelName: string
): boolean {
  return MODEL_RECOMMENDATIONS[taskType]?.some(
    (r) => r.model === modelName && r.tier === "recommended"
  ) ?? false;
}
