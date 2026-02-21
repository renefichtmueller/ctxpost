/**
 * Google Trends Integration (Free, no API key required)
 * Uses the public Google Trends RSS feeds and autocomplete API
 */

export interface TrendingTopic {
  title: string;
  description: string;
  link: string;
  traffic: string; // e.g., "200K+"
  relatedQueries: string[];
}

export interface TrendSuggestion {
  query: string;
  type: string;
}

/**
 * Fetch daily trending searches from Google Trends RSS
 * Uses the public RSS feed (no API key needed)
 */
export async function fetchGoogleTrends(
  geo: string = "DE" // Country code: DE, US, FR, ES, BR, etc.
): Promise<TrendingTopic[]> {
  try {
    const url = `https://trends.google.com/trending/rss?geo=${geo}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SocialScheduler/1.0" },
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    clearTimeout(timeout);

    if (!response.ok) return [];

    const xml = await response.text();
    return parseTrendsRSS(xml);
  } catch {
    return [];
  }
}

/**
 * Parse Google Trends RSS XML
 */
function parseTrendsRSS(xml: string): TrendingTopic[] {
  const items: TrendingTopic[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;

  const getTag = (content: string, tag: string): string => {
    const cdataMatch = content.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
    if (cdataMatch) return cdataMatch[1].trim();
    const match = content.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
    return match ? match[1].trim() : "";
  };

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = getTag(content, "title");
    const link = getTag(content, "link");
    const traffic = getTag(content, "ht:approx_traffic") || getTag(content, "ht:picture_source");
    const description = getTag(content, "description")
      .replace(/<[^>]*>/g, "")
      .trim();

    // Extract related news titles
    const newsItems: string[] = [];
    const newsRegex = /<ht:news_item_title>([^<]+)<\/ht:news_item_title>/g;
    let newsMatch;
    while ((newsMatch = newsRegex.exec(content)) !== null) {
      newsItems.push(newsMatch[1].trim());
    }

    if (title) {
      items.push({
        title,
        description: description || newsItems[0] || "",
        link: link || `https://trends.google.com/trends/explore?q=${encodeURIComponent(title)}`,
        traffic: traffic || "",
        relatedQueries: newsItems.slice(0, 3),
      });
    }
  }

  return items;
}

/**
 * Get trend suggestions via Google Trends autocomplete
 * Free, no API key, but rate-limited
 */
export async function getTrendSuggestions(query: string): Promise<TrendSuggestion[]> {
  if (!query || query.length < 2) return [];

  try {
    const url = `https://trends.google.com/trends/api/autocomplete/${encodeURIComponent(query)}?hl=en`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SocialScheduler/1.0" },
      next: { revalidate: 3600 },
    });

    clearTimeout(timeout);

    if (!response.ok) return [];

    // Google Trends API prepends ")]}'" for security
    let text = await response.text();
    text = text.replace(/^\)\]\}',?\n?/, "");

    const data = JSON.parse(text);
    return (data.default?.topics || []).map((t: { title: string; type: string }) => ({
      query: t.title,
      type: t.type,
    }));
  } catch {
    return [];
  }
}

/**
 * Map locale to Google Trends geo code
 */
export function localeToGeo(locale: string): string {
  const map: Record<string, string> = {
    de: "DE",
    en: "US",
    fr: "FR",
    es: "ES",
    pt: "BR",
  };
  return map[locale] || "US";
}
