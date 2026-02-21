/**
 * RSS Feed Monitor for content inspiration and trend tracking
 * Fetches and parses RSS feeds from major social media / marketing publications
 */

export interface RSSFeed {
  name: string;
  url: string;
  category: "social-media" | "marketing" | "tech" | "industry";
}

export interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  snippet: string;
}

/**
 * Curated list of free RSS feeds for social media marketing insights
 */
export const RSS_FEEDS: RSSFeed[] = [
  // Social Media Marketing
  { name: "Social Media Examiner", url: "https://www.socialmediaexaminer.com/feed/", category: "social-media" },
  { name: "Buffer Blog", url: "https://buffer.com/resources/feed/", category: "social-media" },
  { name: "Hootsuite Blog", url: "https://blog.hootsuite.com/feed/", category: "social-media" },
  // General Marketing
  { name: "HubSpot Marketing", url: "https://blog.hubspot.com/marketing/rss.xml", category: "marketing" },
  { name: "Content Marketing Institute", url: "https://contentmarketinginstitute.com/feed/", category: "marketing" },
  { name: "Neil Patel", url: "https://neilpatel.com/blog/feed/", category: "marketing" },
  // Tech & Trends
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "tech" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", category: "tech" },
];

/**
 * Parse RSS XML into structured items
 */
function parseRSSXml(xml: string, source: string, category: string): FeedItem[] {
  const items: FeedItem[] = [];
  // Simple regex-based XML parsing (no external dep needed)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;

  const getTag = (content: string, tag: string): string => {
    // Handle CDATA
    const cdataMatch = content.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
    if (cdataMatch) return cdataMatch[1].trim();
    const match = content.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
    return match ? match[1].trim() : "";
  };

  // RSS 2.0 format
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = getTag(content, "title");
    const link = getTag(content, "link");
    const pubDate = getTag(content, "pubDate");
    const description = getTag(content, "description");

    if (title && link) {
      items.push({
        title: decodeHtmlEntities(title),
        link,
        pubDate: pubDate || new Date().toISOString(),
        source,
        category,
        snippet: decodeHtmlEntities(stripHtml(description)).slice(0, 200),
      });
    }
  }

  // Atom format fallback
  if (items.length === 0) {
    while ((match = entryRegex.exec(xml)) !== null) {
      const content = match[1];
      const title = getTag(content, "title");
      const linkMatch = content.match(/<link[^>]+href="([^"]+)"/);
      const link = linkMatch ? linkMatch[1] : getTag(content, "link");
      const pubDate = getTag(content, "published") || getTag(content, "updated");
      const summary = getTag(content, "summary") || getTag(content, "content");

      if (title && link) {
        items.push({
          title: decodeHtmlEntities(title),
          link,
          pubDate: pubDate || new Date().toISOString(),
          source,
          category,
          snippet: decodeHtmlEntities(stripHtml(summary)).slice(0, 200),
        });
      }
    }
  }

  return items;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"');
}

/**
 * Fetch a single RSS feed with timeout and error handling
 */
async function fetchFeed(feed: RSSFeed, timeoutMs: number = 5000): Promise<FeedItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(feed.url, {
      signal: controller.signal,
      headers: { "User-Agent": "SocialScheduler/1.0 RSS Reader" },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    clearTimeout(timeout);

    if (!response.ok) return [];

    const xml = await response.text();
    return parseRSSXml(xml, feed.name, feed.category);
  } catch {
    // Silently fail for individual feeds
    return [];
  }
}

/**
 * Fetch all RSS feeds and return combined, sorted results
 */
export async function fetchAllFeeds(
  categories?: string[],
  limit: number = 20
): Promise<FeedItem[]> {
  const feeds = categories
    ? RSS_FEEDS.filter((f) => categories.includes(f.category))
    : RSS_FEEDS;

  const results = await Promise.allSettled(feeds.map((f) => fetchFeed(f)));

  const allItems: FeedItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

  // Sort by date (newest first) and limit
  allItems.sort((a, b) => {
    const dateA = new Date(a.pubDate).getTime() || 0;
    const dateB = new Date(b.pubDate).getTime() || 0;
    return dateB - dateA;
  });

  return allItems.slice(0, limit);
}

/**
 * Extract trending topics from feed items (simple keyword extraction)
 */
export function extractTrendingTopics(items: FeedItem[], topN: number = 10): Array<{ topic: string; count: number }> {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "it", "this", "that", "are", "was",
    "be", "has", "had", "have", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "can", "how", "what", "why", "when",
    "where", "which", "who", "your", "you", "we", "our", "their", "its",
    "not", "no", "all", "more", "most", "new", "one", "just", "about",
    "up", "out", "so", "if", "as", "than", "into", "them", "then", "each",
    "also", "get", "got", "use", "used", "using", "make", "made",
  ]);

  const wordCounts = new Map<string, number>();

  for (const item of items) {
    const text = `${item.title} ${item.snippet}`.toLowerCase();
    const words = text.match(/\b[a-z]{4,}\b/g) || [];
    const seen = new Set<string>();

    for (const word of words) {
      if (!stopWords.has(word) && !seen.has(word)) {
        seen.add(word);
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
  }

  // Also extract bi-grams (two-word phrases)
  for (const item of items) {
    const text = `${item.title}`.toLowerCase();
    const words = text.split(/\s+/).filter((w) => w.length > 2);
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`.replace(/[^a-z\s]/g, "").trim();
      if (bigram.length > 6 && !stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
        wordCounts.set(bigram, (wordCounts.get(bigram) || 0) + 2); // Weight bi-grams higher
      }
    }
  }

  return Array.from(wordCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([topic, count]) => ({ topic, count }));
}
