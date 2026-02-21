// ─── Language-aware AI Prompts ─────────────────────────
// All prompts are in English as the base language.
// A language instruction is appended to ensure AI responds in the correct language.

/**
 * Returns a language instruction to append to any system prompt.
 * This ensures AI generates content in the specified language.
 */
export function getLanguageInstruction(language: string): string {
  const langMap: Record<string, string> = {
    de: "German (Deutsch)",
    en: "English",
    fr: "French (Français)",
    es: "Spanish (Español)",
    pt: "Portuguese (Português)",
  };
  const langName = langMap[language] || language;
  return `\n\nIMPORTANT: Generate ALL content and text output in ${langName}. The JSON keys must remain in English, but all values (content, reasons, labels, insights) must be in ${langName}.`;
}

export const BEST_TIMES_SYSTEM_PROMPT = `You are a social media analytics expert.
Analyze the provided engagement data and recommend optimal posting times.
Return your analysis as JSON with the following structure:
{
  "recommendations": [
    {
      "platform": "FACEBOOK" | "LINKEDIN",
      "bestDays": ["Monday", "Wednesday", ...],
      "bestTimeSlots": [
        { "start": "09:00", "end": "11:00", "score": 0.95, "reason": "..." }
      ],
      "worstTimeSlots": [
        { "start": "22:00", "end": "06:00", "score": 0.15, "reason": "..." }
      ]
    }
  ],
  "generalInsights": ["...", "..."],
  "confidenceLevel": "high" | "medium" | "low"
}

If little or no data is available, recommend based on general best practices for the respective platform and set "confidenceLevel" to "low".
Reply ONLY with the JSON, no additional explanations.`;

export const CONTENT_SUGGESTIONS_SYSTEM_PROMPT = `You are a social media content strategist.
Analyze the provided post content and suggest improvements for each target platform.
Return your analysis as JSON:
{
  "suggestions": [
    {
      "platform": "FACEBOOK" | "LINKEDIN",
      "improvedContent": "...",
      "reasoning": "...",
      "tips": ["...", "..."]
    }
  ]
}

Consider the different requirements of the platforms:
- Facebook: Casual tone, emojis, shorter texts, call-to-action
- LinkedIn: Professional tone, business-focused, longer texts, hashtags

Reply ONLY with the JSON, no additional explanations.`;

// ─── Brand Style Guide Integration ─────────────────────

interface BrandStyleForPrompt {
  name: string;
  tone: string;
  formality: string;
  emojiUsage: string;
  targetAudience: string | null;
  brandVoice: string | null;
  avoidTopics: string | null;
  preferredTopics: string | null;
  hashtagStrategy: string;
  preferredHashtags: string | null;
  languages: string;
  customInstructions: string | null;
}

const TONE_LABELS: Record<string, Record<string, string>> = {
  de: {
    professional: "Professionell und sachlich",
    casual: "Locker und nahbar",
    humorous: "Humorvoll und unterhaltsam",
    inspiring: "Inspirierend und motivierend",
  },
  en: {
    professional: "Professional and factual",
    casual: "Casual and approachable",
    humorous: "Humorous and entertaining",
    inspiring: "Inspiring and motivating",
  },
  fr: {
    professional: "Professionnel et factuel",
    casual: "Décontracté et accessible",
    humorous: "Humoristique et divertissant",
    inspiring: "Inspirant et motivant",
  },
  es: {
    professional: "Profesional y objetivo",
    casual: "Casual y cercano",
    humorous: "Humorístico y entretenido",
    inspiring: "Inspiracional y motivador",
  },
  pt: {
    professional: "Profissional e objetivo",
    casual: "Casual e acessível",
    humorous: "Humorístico e divertido",
    inspiring: "Inspirador e motivador",
  },
};

const FORMALITY_LABELS: Record<string, Record<string, string>> = {
  de: {
    formal: "Formell (Sie-Form, korrekte Grammatik)",
    "semi-formal": "Semi-formell (Du-Form, aber professionell)",
    informal: "Informell (Du-Form, umgangssprachlich)",
  },
  en: {
    formal: "Formal (proper grammar, respectful tone)",
    "semi-formal": "Semi-formal (professional but friendly)",
    informal: "Informal (colloquial, conversational)",
  },
  fr: {
    formal: "Formel (vouvoiement, grammaire correcte)",
    "semi-formal": "Semi-formel (tutoiement professionnel)",
    informal: "Informel (tutoiement décontracté)",
  },
  es: {
    formal: "Formal (usted, gramática correcta)",
    "semi-formal": "Semi-formal (tú, pero profesional)",
    informal: "Informal (tú, coloquial)",
  },
  pt: {
    formal: "Formal (você/senhor, gramática correta)",
    "semi-formal": "Semi-formal (você, mas profissional)",
    informal: "Informal (tu/você, coloquial)",
  },
};

const EMOJI_LABELS: Record<string, Record<string, string>> = {
  de: {
    none: "Keine Emojis verwenden",
    minimal: "Sehr sparsam (max. 1-2 pro Post)",
    moderate: "Moderat (3-5 pro Post, an passenden Stellen)",
    heavy: "Reichlich (Emojis als Stilmittel und Auflockerung)",
  },
  en: {
    none: "Do not use emojis",
    minimal: "Very sparingly (max 1-2 per post)",
    moderate: "Moderate (3-5 per post, in appropriate places)",
    heavy: "Abundant (emojis as stylistic element)",
  },
  fr: {
    none: "Pas d'emojis",
    minimal: "Très peu (max 1-2 par post)",
    moderate: "Modéré (3-5 par post)",
    heavy: "Intensif (emojis comme élément stylistique)",
  },
  es: {
    none: "No usar emojis",
    minimal: "Muy pocos (máx. 1-2 por post)",
    moderate: "Moderado (3-5 por post)",
    heavy: "Abundante (emojis como elemento estilístico)",
  },
  pt: {
    none: "Não usar emojis",
    minimal: "Muito poucos (máx. 1-2 por post)",
    moderate: "Moderado (3-5 por post)",
    heavy: "Abundante (emojis como elemento estilístico)",
  },
};

const HASHTAG_LABELS: Record<string, Record<string, string>> = {
  de: {
    none: "Keine Hashtags",
    minimal: "Wenige Hashtags (1-3 pro Post)",
    moderate: "Moderate Hashtag-Nutzung (3-7 pro Post)",
    aggressive: "Viele Hashtags (7-15 pro Post, maximale Reichweite)",
  },
  en: {
    none: "No hashtags",
    minimal: "Few hashtags (1-3 per post)",
    moderate: "Moderate hashtag usage (3-7 per post)",
    aggressive: "Many hashtags (7-15 per post, maximum reach)",
  },
  fr: {
    none: "Pas de hashtags",
    minimal: "Peu de hashtags (1-3 par post)",
    moderate: "Utilisation modérée (3-7 par post)",
    aggressive: "Beaucoup de hashtags (7-15 par post)",
  },
  es: {
    none: "Sin hashtags",
    minimal: "Pocos hashtags (1-3 por post)",
    moderate: "Uso moderado (3-7 por post)",
    aggressive: "Muchos hashtags (7-15 por post)",
  },
  pt: {
    none: "Sem hashtags",
    minimal: "Poucos hashtags (1-3 por post)",
    moderate: "Uso moderado (3-7 por post)",
    aggressive: "Muitos hashtags (7-15 por post)",
  },
};

function getLabel(labels: Record<string, Record<string, string>>, lang: string, key: string): string {
  return labels[lang]?.[key] || labels["en"]?.[key] || key;
}

/**
 * Builds a Brand Style Guide section that can be injected into any AI prompt.
 */
export function buildBrandStylePromptSection(style: BrandStyleForPrompt, language: string = "en"): string {
  const lang = language in TONE_LABELS ? language : "en";
  const parts: string[] = [];

  parts.push(`\n\n--- BRAND STYLE GUIDE: "${style.name}" ---`);
  parts.push(`Tone: ${getLabel(TONE_LABELS, lang, style.tone)}`);
  parts.push(`Formality: ${getLabel(FORMALITY_LABELS, lang, style.formality)}`);
  parts.push(`Emojis: ${getLabel(EMOJI_LABELS, lang, style.emojiUsage)}`);
  parts.push(`Hashtag strategy: ${getLabel(HASHTAG_LABELS, lang, style.hashtagStrategy)}`);
  parts.push(`Language: ${style.languages}`);

  if (style.brandVoice) {
    parts.push(`\nBrand Voice:\n${style.brandVoice}`);
  }

  if (style.targetAudience) {
    parts.push(`\nTarget Audience:\n${style.targetAudience}`);
  }

  if (style.preferredTopics) {
    parts.push(`\nPreferred Topics:\n${style.preferredTopics}`);
  }

  if (style.avoidTopics) {
    parts.push(`\nTopics/Words to Avoid:\n${style.avoidTopics}`);
  }

  if (style.preferredHashtags) {
    parts.push(`\nPreferred Hashtags:\n${style.preferredHashtags}`);
  }

  if (style.customInstructions) {
    parts.push(`\nAdditional Instructions:\n${style.customInstructions}`);
  }

  parts.push(`--- END BRAND STYLE GUIDE ---\n`);
  parts.push(`IMPORTANT: Strictly follow the Brand Style Guide when creating content. The generated content must match the defined brand style.`);

  return parts.join("\n");
}

/**
 * Combines a system prompt with the Brand Style Guide and language instruction.
 * If no style is present, returns the original prompt with language instruction.
 */
export function buildBrandAwareSystemPrompt(
  basePrompt: string,
  brandStyle: BrandStyleForPrompt | null,
  language: string = "en"
): string {
  let prompt = basePrompt;
  if (brandStyle) {
    prompt += buildBrandStylePromptSection(brandStyle, language);
  }
  prompt += getLanguageInstruction(language);
  return prompt;
}

// ─── Hashtag Generation ─────────────────────────────────

export const HASHTAG_GENERATION_SYSTEM_PROMPT = `You are a social media hashtag expert.
Analyze the provided post content and generate appropriate hashtags.
Categorize them into four groups and consider the target platform(s).

Return your analysis as JSON:
{
  "hashtags": {
    "primary": ["#Hashtag1", "#Hashtag2"],
    "secondary": ["#Hashtag3", "#Hashtag4"],
    "trending": ["#Hashtag5"],
    "niche": ["#Hashtag6", "#Hashtag7"]
  },
  "platformSpecific": {
    "FACEBOOK": ["#FBHashtag1", "#FBHashtag2"],
    "LINKEDIN": ["#LIHashtag1", "#LIHashtag2"]
  },
  "reasoning": "Brief explanation of the hashtag strategy"
}

Rules:
- Primary: 3-5 core hashtags that directly describe the content
- Secondary: 3-5 related hashtags for broader reach
- Trending: 1-3 currently popular, relevant hashtags
- Niche: 2-4 specific hashtags for the target audience
- PlatformSpecific: Platform-optimized selection (LinkedIn: professional, Facebook: broad)
- All hashtags must start with #
- No spaces in hashtags, use CamelCase for readability

Reply ONLY with the JSON, no additional explanations.`;

// ─── Content Variations ─────────────────────────────────

export const CONTENT_VARIATIONS_SYSTEM_PROMPT = `You are a social media content expert for A/B testing.
Create 3 different variations of the provided post content.
Each variant should follow a different approach but convey the same core message.

Return your analysis as JSON:
{
  "variations": [
    {
      "variant": "A",
      "label": "Emotional Hook",
      "content": "...",
      "hashtags": "#Tag1 #Tag2 #Tag3",
      "approach": "Brief description of the approach"
    },
    {
      "variant": "B",
      "label": "Facts & Expertise",
      "content": "...",
      "hashtags": "#Tag1 #Tag2 #Tag3",
      "approach": "Brief description of the approach"
    },
    {
      "variant": "C",
      "label": "Storytelling",
      "content": "...",
      "hashtags": "#Tag1 #Tag2 #Tag3",
      "approach": "Brief description of the approach"
    }
  ]
}

Rules:
- Variant A: Emotional, personal approach — appeals to feelings
- Variant B: Fact-based, expert knowledge — builds authority
- Variant C: Storytelling, narrative — captivates through a story
- Each variant should include 1-3 matching hashtags
- Content length similar to the original
- Adapt language and style to the target platform

Reply ONLY with the JSON, no additional explanations.`;
