/**
 * Automatically detects the content type based on the post content.
 */

const VIDEO_PATTERNS = [
  /youtube\.com\/watch/i,
  /youtu\.be\//i,
  /vimeo\.com\//i,
  /tiktok\.com\//i,
  /\.mp4(\?|$)/i,
  /\.webm(\?|$)/i,
  /\.mov(\?|$)/i,
];

const IMAGE_PATTERNS = [
  /\.jpg(\?|$)/i,
  /\.jpeg(\?|$)/i,
  /\.png(\?|$)/i,
  /\.gif(\?|$)/i,
  /\.webp(\?|$)/i,
  /\.svg(\?|$)/i,
];

const URL_PATTERN = /https?:\/\/[^\s]+/gi;

export type DetectedContentType = "TEXT" | "LINK" | "IMAGE" | "VIDEO";

export function detectContentType(content: string): DetectedContentType {
  const urls = content.match(URL_PATTERN);

  if (!urls || urls.length === 0) {
    return "TEXT";
  }

  // Check if any URL points to a video
  for (const url of urls) {
    for (const pattern of VIDEO_PATTERNS) {
      if (pattern.test(url)) {
        return "VIDEO";
      }
    }
  }

  // Check if any URL points to an image
  for (const url of urls) {
    for (const pattern of IMAGE_PATTERNS) {
      if (pattern.test(url)) {
        return "IMAGE";
      }
    }
  }

  // URL present but no specific media type → LINK
  return "LINK";
}
