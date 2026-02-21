/**
 * Simple language detection based on character frequency and common words.
 * No external dependencies required.
 *
 * Supports: de, en, fr, es, pt
 */

interface LanguageScore {
  language: string;
  score: number;
  confidence: "high" | "medium" | "low";
}

/**
 * Common words unique to each language (stop words + frequent words)
 * These words are highly indicative of a specific language
 */
const LANGUAGE_MARKERS: Record<string, string[]> = {
  de: [
    "der", "die", "das", "und", "ist", "ein", "eine", "für", "mit", "auf",
    "den", "dem", "des", "sich", "von", "nicht", "auch", "noch", "aber",
    "wie", "sind", "kann", "wird", "hat", "haben", "ich", "wir", "sie",
    "über", "nach", "bei", "oder", "nur", "durch", "sehr", "diese",
    "wenn", "können", "alle", "muss", "mehr", "dann", "schon", "hier",
    "macht", "gibt", "neue", "weil", "wurde", "waren", "jetzt", "immer",
  ],
  en: [
    "the", "and", "is", "are", "was", "for", "with", "that", "this",
    "have", "from", "not", "but", "they", "which", "their", "been",
    "would", "could", "should", "about", "will", "your", "there",
    "just", "some", "than", "them", "very", "when", "what", "each",
    "much", "because", "does", "between", "being", "through",
    "where", "those", "while", "before", "after", "might", "these",
  ],
  fr: [
    "les", "des", "est", "une", "pour", "dans", "qui", "pas", "sur",
    "sont", "avec", "plus", "tout", "fait", "mais", "aussi", "peut",
    "cette", "nous", "vous", "leur", "bien", "elle", "ses", "entre",
    "même", "très", "comme", "ont", "ces", "encore", "être", "sans",
    "aux", "deux", "été", "faire", "après", "avoir", "donc", "alors",
    "chez", "peu", "sous", "depuis", "autre", "ainsi", "puis",
  ],
  es: [
    "los", "las", "del", "una", "por", "con", "que", "para", "como",
    "más", "pero", "sus", "también", "son", "muy", "fue", "hay",
    "este", "esta", "todo", "desde", "sobre", "entre", "cuando",
    "tiene", "puede", "han", "nos", "ser", "sin", "después",
    "donde", "mucho", "otro", "cada", "hacer", "todos", "bien",
    "esos", "algo", "quien", "antes", "siempre", "además",
  ],
  pt: [
    "dos", "das", "uma", "por", "com", "para", "como", "mais", "mas",
    "são", "tem", "foi", "muito", "também", "pode", "sua", "seu",
    "nos", "sem", "sobre", "entre", "quando", "todo", "ainda",
    "isso", "essa", "esse", "cada", "outro", "após", "fazer",
    "desde", "onde", "bem", "antes", "sempre", "além", "assim",
    "já", "pelo", "pela", "ter", "há", "aqui", "então",
  ],
};

/**
 * Character patterns that are distinctive to certain languages
 */
const CHAR_PATTERNS: Record<string, RegExp[]> = {
  de: [/ä/i, /ö/i, /ü/i, /ß/, /ck/, /sch/, /ei/, /ie/],
  fr: [/ç/, /è/, /ê/, /ë/, /î/, /ô/, /û/, /œ/, /qu/i, /eux/],
  es: [/ñ/, /¿/, /¡/, /ción/, /mente/],
  pt: [/ão/, /ão/, /ç/, /ê/, /ó/, /ú/, /nh/, /lh/],
  en: [/th/i, /ght/, /tion/, /ness/, /ing\b/],
};

/**
 * Detect the language of a text string.
 * Returns the most likely language code and confidence level.
 */
export function detectLanguage(text: string): LanguageScore {
  if (!text || text.trim().length < 10) {
    return { language: "en", score: 0, confidence: "low" };
  }

  const normalizedText = text.toLowerCase().trim();
  const words = normalizedText.match(/\b[a-zà-ÿ]+\b/g) || [];

  if (words.length < 3) {
    return { language: "en", score: 0, confidence: "low" };
  }

  const scores: Record<string, number> = { de: 0, en: 0, fr: 0, es: 0, pt: 0 };

  // Word-based scoring (primary signal)
  for (const word of words) {
    for (const [lang, markers] of Object.entries(LANGUAGE_MARKERS)) {
      if (markers.includes(word)) {
        scores[lang] += 2;
      }
    }
  }

  // Character pattern scoring (secondary signal)
  for (const [lang, patterns] of Object.entries(CHAR_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = normalizedText.match(new RegExp(pattern, "gi"));
      if (matches) {
        scores[lang] += matches.length * 0.5;
      }
    }
  }

  // Find top language
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topLang, topScore] = sorted[0];
  const [, secondScore] = sorted[1];

  // Determine confidence
  let confidence: "high" | "medium" | "low" = "low";
  const scoreDiff = topScore - secondScore;
  const totalWords = words.length;

  if (topScore > totalWords * 0.3 && scoreDiff > totalWords * 0.1) {
    confidence = "high";
  } else if (topScore > totalWords * 0.15 && scoreDiff > 2) {
    confidence = "medium";
  }

  return {
    language: topLang,
    score: topScore,
    confidence,
  };
}

/**
 * Detect language or fall back to a default
 */
export function detectLanguageOrDefault(text: string, defaultLang: string = "en"): string {
  const result = detectLanguage(text);
  return result.confidence !== "low" ? result.language : defaultLang;
}
