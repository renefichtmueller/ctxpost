/**
 * Comprehensive AI model descriptions and metadata.
 * Includes VRAM requirements, strengths, and task recommendations.
 */

export interface ModelDescription {
  name: string;
  family: string;
  category: "text" | "vision" | "embedding" | "reasoning";
  parameterSize: string;
  vramRequired: string;
  strengths: string[];
  bestFor: string[];
  descriptionKey: string; // Translation key in "models" namespace
}

/**
 * Detailed model info keyed by model name (as seen in Ollama).
 * descriptionKey points to a translation key in the "models" namespace.
 */
export const MODEL_DESCRIPTIONS: Record<string, ModelDescription> = {
  // ── Qwen 2.5 family ──
  "qwen2.5:7b": {
    name: "Qwen 2.5 7B",
    family: "Qwen",
    category: "text",
    parameterSize: "7B",
    vramRequired: "~5 GB",
    strengths: ["strengthFastInference", "strengthGoodMultilingual", "strengthLowResources"],
    bestFor: ["bestForQuickDrafts", "bestForHashtagGeneration", "bestForSimpleTexts"],
    descriptionKey: "desc_qwen25_7b",
  },
  "qwen2.5:14b": {
    name: "Qwen 2.5 14B",
    family: "Qwen",
    category: "text",
    parameterSize: "14B",
    vramRequired: "~10 GB",
    strengths: ["strengthQualitySpeedBalance", "strengthStrongMultilingual", "strengthStructuredOutput"],
    bestFor: ["bestForContentGeneration", "bestForAnalysis", "bestForHashtags"],
    descriptionKey: "desc_qwen25_14b",
  },
  "qwen2.5:32b": {
    name: "Qwen 2.5 32B",
    family: "Qwen",
    category: "text",
    parameterSize: "32B",
    vramRequired: "~20 GB",
    strengths: ["strengthExcellentQuality", "strengthBestQwenContent", "strengthStrongJson"],
    bestFor: ["bestForHighQualityContent", "bestForComplexAnalysis", "bestForBrandVoice"],
    descriptionKey: "desc_qwen25_32b",
  },

  // ── Llama 3.1 family ──
  "llama3.1:8b": {
    name: "Llama 3.1 8B",
    family: "Llama",
    category: "text",
    parameterSize: "8B",
    vramRequired: "~5 GB",
    strengths: ["strengthMetaLatest", "strengthFast", "strengthGoodEnglish"],
    bestFor: ["bestForEnglishContent", "bestForQuickDraftsGeneral", "bestForGeneralTasks"],
    descriptionKey: "desc_llama31_8b",
  },
  "llama3.1:70b": {
    name: "Llama 3.1 70B",
    family: "Llama",
    category: "text",
    parameterSize: "70B",
    vramRequired: "~40 GB",
    strengths: ["strengthTopTierQuality", "strengthComplexReasoning", "strengthNuancedWriting"],
    bestFor: ["bestForPremiumContent", "bestForInDepthAnalysis", "bestForCreativeWriting"],
    descriptionKey: "desc_llama31_70b",
  },

  // ── Mistral family ──
  "mistral:7b": {
    name: "Mistral 7B",
    family: "Mistral",
    category: "text",
    parameterSize: "7B",
    vramRequired: "~5 GB",
    strengths: ["strengthVeryEfficient", "strengthGoodEuropeanLangs", "strengthFast"],
    bestFor: ["bestForMultilingualContent", "bestForQuickGeneration", "bestForEfficientProcessing"],
    descriptionKey: "desc_mistral_7b",
  },

  // ── Gemma family ──
  "gemma2:9b": {
    name: "Gemma 2 9B",
    family: "Gemma",
    category: "text",
    parameterSize: "9B",
    vramRequired: "~6 GB",
    strengths: ["strengthGoogleQuality", "strengthGoodInstructionFollowing", "strengthCompact"],
    bestFor: ["bestForStructuredContent", "bestForFollowingGuidelines", "bestForBalancedTasks"],
    descriptionKey: "desc_gemma2_9b",
  },
  "gemma2:27b": {
    name: "Gemma 2 27B",
    family: "Gemma",
    category: "text",
    parameterSize: "27B",
    vramRequired: "~17 GB",
    strengths: ["strengthHighQuality", "strengthStrongInstructionAdherence", "strengthReliable"],
    bestFor: ["bestForProfessionalContent", "bestForBrandConsistency", "bestForAnalysis"],
    descriptionKey: "desc_gemma2_27b",
  },

  // ── DeepSeek family ──
  "deepseek-r1:14b": {
    name: "DeepSeek R1 14B",
    family: "DeepSeek",
    category: "reasoning",
    parameterSize: "14B",
    vramRequired: "~10 GB",
    strengths: ["strengthChainOfThought", "strengthAnalyticalThinking", "strengthProblemSolving"],
    bestFor: ["bestForDataAnalysis", "bestForStrategyPlanning", "bestForComplexDecisions"],
    descriptionKey: "desc_deepseek_r1_14b",
  },

  // ── Vision models ──
  "llava:7b": {
    name: "LLaVA 7B",
    family: "LLaVA",
    category: "vision",
    parameterSize: "7B",
    vramRequired: "~5 GB",
    strengths: ["strengthImageUnderstanding", "strengthFastProcessing", "strengthGoodDescriptions"],
    bestFor: ["bestForImageAnalysis", "bestForAltText", "bestForVisualContentReview"],
    descriptionKey: "desc_llava_7b",
  },
  "llava:13b": {
    name: "LLaVA 13B",
    family: "LLaVA",
    category: "vision",
    parameterSize: "13B",
    vramRequired: "~8 GB",
    strengths: ["strengthBetterImageUnderstanding", "strengthDetailedDescriptions", "strengthAccurate"],
    bestFor: ["bestForDetailedImageAnalysis", "bestForContentModeration", "bestForVisualQA"],
    descriptionKey: "desc_llava_13b",
  },
  "bakllava:latest": {
    name: "BakLLaVA",
    family: "BakLLaVA",
    category: "vision",
    parameterSize: "7B",
    vramRequired: "~5 GB",
    strengths: ["strengthEnhancedVision", "strengthGoodOCR", "strengthFast"],
    bestFor: ["bestForImageAnalysis", "bestForTextExtraction", "bestForQuickVisualTasks"],
    descriptionKey: "desc_bakllava",
  },
  "llava-llama3:8b": {
    name: "LLaVA Llama3 8B",
    family: "LLaVA",
    category: "vision",
    parameterSize: "8B",
    vramRequired: "~5 GB",
    strengths: ["strengthLlama3Base", "strengthModernArchitecture", "strengthGoodQuality"],
    bestFor: ["bestForImageUnderstanding", "bestForVisualContent", "bestForMultimodalTasks"],
    descriptionKey: "desc_llava_llama3_8b",
  },

  // ── Embedding models ──
  "nomic-embed-text": {
    name: "Nomic Embed Text",
    family: "Nomic",
    category: "embedding",
    parameterSize: "137M",
    vramRequired: "~0.5 GB",
    strengths: ["strengthHighQualityEmbeddings", "strengthLongContext", "strengthFast"],
    bestFor: ["bestForRAGSystems", "bestForSemanticSearch", "bestForDocumentSimilarity"],
    descriptionKey: "desc_nomic_embed",
  },
};

/**
 * Get the description for a model, with fallback for unknown models.
 */
export function getModelDescription(modelName: string): ModelDescription | null {
  // Exact match
  if (MODEL_DESCRIPTIONS[modelName]) {
    return MODEL_DESCRIPTIONS[modelName];
  }

  // Try without tag (e.g., "qwen2.5:32b-instruct" → "qwen2.5:32b")
  const baseName = modelName.split("-")[0];
  if (MODEL_DESCRIPTIONS[baseName]) {
    return MODEL_DESCRIPTIONS[baseName];
  }

  return null;
}

/**
 * Get category icon and color for UI display.
 */
export function getCategoryStyle(category: ModelDescription["category"]): {
  colorClass: string;
  bgClass: string;
  labelKey: string;
} {
  switch (category) {
    case "text":
      return { colorClass: "text-blue-600", bgClass: "bg-blue-500/15", labelKey: "categoryText" };
    case "vision":
      return { colorClass: "text-purple-600", bgClass: "bg-purple-500/15", labelKey: "categoryVision" };
    case "embedding":
      return { colorClass: "text-orange-600", bgClass: "bg-orange-500/15", labelKey: "categoryEmbedding" };
    case "reasoning":
      return { colorClass: "text-emerald-600", bgClass: "bg-emerald-500/15", labelKey: "categoryReasoning" };
  }
}
