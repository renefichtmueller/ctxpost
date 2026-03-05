/**
 * RSS Feed AI Enhancer
 * Transforms raw RSS feed items into polished, ready-to-publish social media posts
 * using the configured AI provider (Ollama or Claude).
 */

import { type AIConfig, askAI } from "./ai-provider";
import type { FeedItem } from "@/lib/data/rss-monitor";

const RSS_ENHANCER_SYSTEM_PROMPT = `You are a social media marketing expert who transforms news articles and blog posts into engaging, ready-to-publish social media posts.

Your task: Take article information (title, snippet, source, link) and create a compelling social media post that:
- Starts with a strong hook (a thought-provoking question, bold statement, or surprising fact)
- Summarizes the key insight or value in 2-4 sentences
- Sounds authentic and human — not like AI wrote it
- Includes 3-5 relevant hashtags at the end (using CamelCase, starting with #)
- Ends with the article link on a new line

Return ONLY valid JSON:
{
  "content": "The complete social media post text, including hashtags and link on a new line at the end"
}

Rules:
- Maximum 280 characters for the core message text (before hashtags and link)
- Use 1-3 relevant emojis max
- Hashtags must start with # and use CamelCase (e.g. #SocialMedia, #ContentMarketing)
- Always include the source link at the very end on its own line
- Do NOT wrap the link in markdown, use plain URL
- Reply ONLY with valid JSON, no markdown code blocks, no additional text`;

const CATEGORY_TONE_HINTS: Record<string, string> = {
  "social-media": "Focus on social media strategy, community building, and platform-specific tips.",
  "marketing": "Focus on marketing ROI, brand building, lead generation, and conversion insights.",
  "tech": "Focus on how this technology impacts businesses and everyday users. Make it accessible.",
  "industry": "Focus on industry trends, competitive implications, and actionable takeaways.",
};

/**
 * Enhances an RSS feed item into a polished social media post using AI.
 * Falls back gracefully to raw formatted content if AI fails or is unavailable.
 */
export async function enhanceRSSItemWithAI(
  item: FeedItem,
  config: AIConfig
): Promise<{ content: string; aiEnhanced: boolean }> {
  // Raw fallback content
  const rawContent = [
    item.title,
    item.snippet ? `\n${item.snippet}` : "",
    item.link ? `\n\n${item.link}` : "",
  ]
    .join("")
    .trim();

  try {
    const categoryHint = CATEGORY_TONE_HINTS[item.category] || "";

    const userMessage = `Transform this article into an engaging social media post:

Title: ${item.title}
Source: ${item.source} (category: ${item.category})
Snippet: ${item.snippet || "No snippet available"}
Link: ${item.link}
${categoryHint ? `\nTone guidance: ${categoryHint}` : ""}

Create a compelling post that shares the key insight and drives engagement. Include the link at the end.`;

    const response = await askAI(config, RSS_ENHANCER_SYSTEM_PROMPT, userMessage);

    // Extract JSON from response (handle cases where model adds markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in AI response");
    }

    const result = JSON.parse(jsonMatch[0]) as { content?: string };

    const content = result.content?.trim();
    if (!content || content.length < 30) {
      throw new Error("AI returned empty or too-short content");
    }

    // Ensure the link is present in the content
    if (item.link && !content.includes(item.link)) {
      return {
        content: `${content}\n\n${item.link}`,
        aiEnhanced: true,
      };
    }

    return { content, aiEnhanced: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.warn(
      `[RSS Enhancer] AI enhancement failed for "${item.title.slice(0, 50)}…": ${errorMsg} — falling back to raw content`
    );
    return { content: rawContent, aiEnhanced: false };
  }
}

/**
 * Enhances multiple RSS items in sequence (not parallel to avoid overloading the LLM).
 * Returns results with per-item success/failure info.
 */
export async function enhanceRSSItemsBatch(
  items: FeedItem[],
  config: AIConfig
): Promise<Array<{ item: FeedItem; content: string; aiEnhanced: boolean }>> {
  const results: Array<{ item: FeedItem; content: string; aiEnhanced: boolean }> = [];

  for (const item of items) {
    const result = await enhanceRSSItemWithAI(item, config);
    results.push({ item, ...result });
  }

  return results;
}
