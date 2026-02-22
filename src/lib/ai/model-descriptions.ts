/**
 * Comprehensive AI model descriptions and metadata.
 * Includes VRAM requirements, strengths, and task recommendations.
 */

export interface ModelDescription {
  name: string;
  family: string;
  category: "text" | "vision" | "embedding" | "reasoning" | "code" | "image";
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
  "qwen2.5:7b-instruct": {
    name: "Qwen 2.5 7B Instruct",
    family: "Qwen",
    category: "text",
    parameterSize: "7B",
    vramRequired: "~5 GB",
    strengths: ["strengthFastInference", "strengthGoodInstructionFollowing", "strengthGoodMultilingual"],
    bestFor: ["bestForFollowingGuidelines", "bestForQuickDrafts", "bestForStructuredContent"],
    descriptionKey: "desc_qwen25_7b_instruct",
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
  "qwen2.5:72b": {
    name: "Qwen 2.5 72B",
    family: "Qwen",
    category: "text",
    parameterSize: "72B",
    vramRequired: "~45 GB",
    strengths: ["strengthTopTierQuality", "strengthBestQwenContent", "strengthStrongMultilingual"],
    bestFor: ["bestForPremiumContent", "bestForComplexAnalysis", "bestForCreativeWriting"],
    descriptionKey: "desc_qwen25_72b",
  },

  // ── Qwen3 Coder family ──
  "qwen3-coder:latest": {
    name: "Qwen3 Coder",
    family: "Qwen",
    category: "code",
    parameterSize: "varies",
    vramRequired: "~8 GB",
    strengths: ["strengthCodeGeneration", "strengthCodeReview", "strengthFast"],
    bestFor: ["bestForCodeGeneration", "bestForTechnicalContent", "bestForAutomationScripts"],
    descriptionKey: "desc_qwen3_coder",
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

  // ── Llama 3.2 family ──
  "llama3.2:latest": {
    name: "Llama 3.2",
    family: "Llama",
    category: "text",
    parameterSize: "3B",
    vramRequired: "~2 GB",
    strengths: ["strengthVeryEfficient", "strengthFast", "strengthLowResources"],
    bestFor: ["bestForQuickDrafts", "bestForSimpleTexts", "bestForEdgeDeployment"],
    descriptionKey: "desc_llama32_latest",
  },
  "llama3.2:1b": {
    name: "Llama 3.2 1B",
    family: "Llama",
    category: "text",
    parameterSize: "1B",
    vramRequired: "~1 GB",
    strengths: ["strengthUltraLight", "strengthFast", "strengthLowResources"],
    bestFor: ["bestForSimpleTexts", "bestForEdgeDeployment", "bestForQuickDrafts"],
    descriptionKey: "desc_llama32_1b",
  },
  "llama3.2:3b": {
    name: "Llama 3.2 3B",
    family: "Llama",
    category: "text",
    parameterSize: "3B",
    vramRequired: "~2 GB",
    strengths: ["strengthVeryEfficient", "strengthFast", "strengthLowResources"],
    bestFor: ["bestForQuickDrafts", "bestForSimpleTexts", "bestForEdgeDeployment"],
    descriptionKey: "desc_llama32_latest",
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
  "mistral:latest": {
    name: "Mistral Latest",
    family: "Mistral",
    category: "text",
    parameterSize: "7B",
    vramRequired: "~5 GB",
    strengths: ["strengthVeryEfficient", "strengthGoodEuropeanLangs", "strengthFast"],
    bestFor: ["bestForMultilingualContent", "bestForQuickGeneration", "bestForEfficientProcessing"],
    descriptionKey: "desc_mistral_latest",
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
  "deepseek-r1:32b": {
    name: "DeepSeek R1 32B",
    family: "DeepSeek",
    category: "reasoning",
    parameterSize: "32B",
    vramRequired: "~20 GB",
    strengths: ["strengthChainOfThought", "strengthDeepAnalysis", "strengthHighQuality"],
    bestFor: ["bestForComplexAnalysis", "bestForStrategyPlanning", "bestForResearchTasks"],
    descriptionKey: "desc_deepseek_r1_32b",
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

  // ── Image generation models ──
  "x/z-image-turbo:latest": {
    name: "Z Image Turbo",
    family: "Z-Image",
    category: "image",
    parameterSize: "varies",
    vramRequired: "~6 GB",
    strengths: ["strengthFastImageGen", "strengthGoodQuality", "strengthLowResources"],
    bestFor: ["bestForSocialMediaImages", "bestForQuickImageGen", "bestForVisualContent"],
    descriptionKey: "desc_z_image_turbo",
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
 * Infer a category from a model name string for unknown models.
 */
function inferCategory(modelName: string): ModelDescription["category"] {
  const lower = modelName.toLowerCase();
  if (lower.includes("llava") || lower.includes("vision") || lower.includes("moondream")) return "vision";
  if (lower.includes("code") || lower.includes("coder") || lower.includes("starcoder") || lower.includes("codellama")) return "code";
  if (lower.includes("deepseek-r1") || lower.includes("reasoning")) return "reasoning";
  if (lower.includes("embed") || lower.includes("nomic")) return "embedding";
  if (lower.includes("image") || lower.includes("flux") || lower.includes("sdxl") || lower.includes("stable-diffusion")) return "image";
  return "text";
}

/**
 * Estimate VRAM from parameter size string or model name.
 */
function estimateVram(paramSize: string): string {
  const match = paramSize.match(/([\d.]+)\s*(b|m)/i);
  if (!match) return "~4 GB";
  const num = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "m") return "~0.5 GB";
  if (num <= 1) return "~1 GB";
  if (num <= 3) return "~2 GB";
  if (num <= 8) return "~5 GB";
  if (num <= 14) return "~10 GB";
  if (num <= 27) return "~17 GB";
  if (num <= 34) return "~20 GB";
  if (num <= 72) return "~45 GB";
  return "~50+ GB";
}

/**
 * Extract a human-friendly name from an Ollama model name string.
 */
function humanizeName(modelName: string): string {
  const [base, tag] = modelName.split(":");
  const name = base
    .split(/[-_/]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  if (tag && tag !== "latest") {
    return `${name} ${tag.toUpperCase()}`;
  }
  return name;
}

/**
 * Extract the family name from the model name.
 */
function inferFamily(modelName: string): string {
  const base = modelName.split(":")[0].split("/").pop() || modelName;
  const familyMap: Record<string, string> = {
    qwen: "Qwen",
    llama: "Llama",
    mistral: "Mistral",
    gemma: "Gemma",
    deepseek: "DeepSeek",
    llava: "LLaVA",
    bakllava: "BakLLaVA",
    phi: "Phi",
    nomic: "Nomic",
    starcoder: "StarCoder",
    codellama: "CodeLlama",
    vicuna: "Vicuna",
    yi: "Yi",
    falcon: "Falcon",
    orca: "Orca",
  };
  const lower = base.toLowerCase();
  for (const [key, family] of Object.entries(familyMap)) {
    if (lower.startsWith(key)) return family;
  }
  return base.charAt(0).toUpperCase() + base.slice(1).split(/[^a-zA-Z]/)[0];
}

/**
 * Default strengths based on inferred category.
 */
function defaultStrengths(category: ModelDescription["category"]): string[] {
  switch (category) {
    case "text":
      return ["strengthGoodQuality", "strengthFast", "strengthReliable"];
    case "vision":
      return ["strengthImageUnderstanding", "strengthGoodDescriptions", "strengthFastProcessing"];
    case "code":
      return ["strengthCodeGeneration", "strengthCodeReview", "strengthFast"];
    case "reasoning":
      return ["strengthChainOfThought", "strengthAnalyticalThinking", "strengthProblemSolving"];
    case "embedding":
      return ["strengthHighQualityEmbeddings", "strengthFast", "strengthLongContext"];
    case "image":
      return ["strengthFastImageGen", "strengthGoodQuality", "strengthLowResources"];
  }
}

/**
 * Default bestFor based on inferred category.
 */
function defaultBestFor(category: ModelDescription["category"]): string[] {
  switch (category) {
    case "text":
      return ["bestForContentGeneration", "bestForGeneralTasks", "bestForQuickDrafts"];
    case "vision":
      return ["bestForImageAnalysis", "bestForAltText", "bestForVisualContentReview"];
    case "code":
      return ["bestForCodeGeneration", "bestForTechnicalContent", "bestForAutomationScripts"];
    case "reasoning":
      return ["bestForDataAnalysis", "bestForStrategyPlanning", "bestForComplexDecisions"];
    case "embedding":
      return ["bestForRAGSystems", "bestForSemanticSearch", "bestForDocumentSimilarity"];
    case "image":
      return ["bestForSocialMediaImages", "bestForQuickImageGen", "bestForVisualContent"];
  }
}

/**
 * Get the description for a model, with fallback for unknown models.
 * Now generates a sensible fallback instead of returning null.
 */
export function getModelDescription(
  modelName: string,
  parameterSize?: string,
): ModelDescription {
  // Exact match
  if (MODEL_DESCRIPTIONS[modelName]) {
    return MODEL_DESCRIPTIONS[modelName];
  }

  // Try without tag (e.g., "qwen2.5:32b-instruct" -> "qwen2.5:32b")
  const baseName = modelName.split("-")[0];
  if (MODEL_DESCRIPTIONS[baseName]) {
    return MODEL_DESCRIPTIONS[baseName];
  }

  // Try with :latest removed or added
  const withoutTag = modelName.split(":")[0];
  const withLatest = `${withoutTag}:latest`;
  if (MODEL_DESCRIPTIONS[withLatest]) {
    return MODEL_DESCRIPTIONS[withLatest];
  }

  // Generate a sensible fallback
  const category = inferCategory(modelName);
  const pSize = parameterSize || "unknown";
  return {
    name: humanizeName(modelName),
    family: inferFamily(modelName),
    category,
    parameterSize: pSize,
    vramRequired: estimateVram(pSize),
    strengths: defaultStrengths(category),
    bestFor: defaultBestFor(category),
    descriptionKey: `desc_fallback_${category}`,
  };
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
    case "code":
      return { colorClass: "text-cyan-600", bgClass: "bg-cyan-500/15", labelKey: "categoryCode" };
    case "image":
      return { colorClass: "text-pink-600", bgClass: "bg-pink-500/15", labelKey: "categoryImage" };
  }
}
