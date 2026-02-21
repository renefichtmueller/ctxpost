/**
 * Social Media Engagement Benchmarks
 * Based on industry research from Buffer, Sprout Social, HubSpot, Hootsuite
 *
 * Updated: Q1 2025 - manually update quarterly
 */

export interface PlatformBenchmark {
  platform: string;
  avgEngagementRate: number; // in percent
  avgReach: number; // percent of followers
  bestContentTypes: string[];
  avgPostsPerWeek: number;
  optimalPostLength: { min: number; max: number }; // characters
  hashtagsRecommended: { min: number; max: number };
  videoVsImageLift: number; // percent more engagement for video vs image
}

export const PLATFORM_BENCHMARKS: Record<string, PlatformBenchmark> = {
  FACEBOOK: {
    platform: "Facebook",
    avgEngagementRate: 0.06, // 0.06%
    avgReach: 5.2,
    bestContentTypes: ["video", "carousel", "link"],
    avgPostsPerWeek: 5,
    optimalPostLength: { min: 40, max: 80 },
    hashtagsRecommended: { min: 1, max: 3 },
    videoVsImageLift: 135,
  },
  LINKEDIN: {
    platform: "LinkedIn",
    avgEngagementRate: 2.2,
    avgReach: 9.0,
    bestContentTypes: ["document", "poll", "text"],
    avgPostsPerWeek: 3,
    optimalPostLength: { min: 100, max: 300 },
    hashtagsRecommended: { min: 3, max: 5 },
    videoVsImageLift: 50,
  },
  INSTAGRAM: {
    platform: "Instagram",
    avgEngagementRate: 0.6,
    avgReach: 9.34,
    bestContentTypes: ["reels", "carousel", "stories"],
    avgPostsPerWeek: 5,
    optimalPostLength: { min: 138, max: 150 },
    hashtagsRecommended: { min: 5, max: 15 },
    videoVsImageLift: 38,
  },
  TWITTER: {
    platform: "X / Twitter",
    avgEngagementRate: 0.03,
    avgReach: 3.1,
    bestContentTypes: ["thread", "image", "poll"],
    avgPostsPerWeek: 14,
    optimalPostLength: { min: 71, max: 100 },
    hashtagsRecommended: { min: 1, max: 2 },
    videoVsImageLift: 10,
  },
  THREADS: {
    platform: "Threads",
    avgEngagementRate: 0.8,
    avgReach: 12.0,
    bestContentTypes: ["text", "image", "conversation"],
    avgPostsPerWeek: 7,
    optimalPostLength: { min: 50, max: 200 },
    hashtagsRecommended: { min: 0, max: 3 },
    videoVsImageLift: 20,
  },
};

export interface IndustryBenchmark {
  industry: string;
  facebookEngagement: number;
  linkedinEngagement: number;
  instagramEngagement: number;
  twitterEngagement: number;
}

export const INDUSTRY_BENCHMARKS: IndustryBenchmark[] = [
  { industry: "Technology", facebookEngagement: 0.04, linkedinEngagement: 2.5, instagramEngagement: 0.5, twitterEngagement: 0.02 },
  { industry: "E-Commerce", facebookEngagement: 0.08, linkedinEngagement: 1.5, instagramEngagement: 0.8, twitterEngagement: 0.03 },
  { industry: "Education", facebookEngagement: 0.12, linkedinEngagement: 3.0, instagramEngagement: 1.2, twitterEngagement: 0.05 },
  { industry: "Healthcare", facebookEngagement: 0.07, linkedinEngagement: 2.8, instagramEngagement: 0.9, twitterEngagement: 0.04 },
  { industry: "Finance", facebookEngagement: 0.03, linkedinEngagement: 2.2, instagramEngagement: 0.4, twitterEngagement: 0.02 },
  { industry: "Food & Beverage", facebookEngagement: 0.10, linkedinEngagement: 1.2, instagramEngagement: 1.5, twitterEngagement: 0.04 },
  { industry: "Travel", facebookEngagement: 0.09, linkedinEngagement: 1.0, instagramEngagement: 1.3, twitterEngagement: 0.03 },
  { industry: "Fashion", facebookEngagement: 0.05, linkedinEngagement: 0.8, instagramEngagement: 0.7, twitterEngagement: 0.02 },
  { industry: "SaaS", facebookEngagement: 0.04, linkedinEngagement: 3.5, instagramEngagement: 0.3, twitterEngagement: 0.03 },
  { industry: "Non-Profit", facebookEngagement: 0.15, linkedinEngagement: 2.0, instagramEngagement: 1.0, twitterEngagement: 0.06 },
];

/**
 * Content type performance multipliers relative to a standard text post (1.0)
 */
export const CONTENT_TYPE_MULTIPLIERS: Record<string, Record<string, number>> = {
  FACEBOOK: { text: 1.0, image: 1.8, video: 4.3, link: 1.2, carousel: 2.5, story: 1.5 },
  LINKEDIN: { text: 1.3, image: 1.5, video: 2.0, document: 3.0, poll: 2.8, article: 1.2 },
  INSTAGRAM: { image: 1.0, carousel: 1.4, reels: 2.0, story: 0.8 },
  TWITTER: { text: 1.0, image: 1.5, video: 1.6, thread: 2.0, poll: 2.5 },
  THREADS: { text: 1.0, image: 1.3, conversation: 1.8 },
};

/**
 * Get a benchmark comparison for user's actual metrics vs industry average
 */
export function compareToBenchmark(
  platform: string,
  userEngagementRate: number,
  industry?: string
): { rating: "above" | "average" | "below"; percentDiff: number; benchmark: number } {
  const industryData = industry
    ? INDUSTRY_BENCHMARKS.find((b) => b.industry.toLowerCase() === industry.toLowerCase())
    : null;

  const platformBenchmark = PLATFORM_BENCHMARKS[platform];
  if (!platformBenchmark) {
    return { rating: "average", percentDiff: 0, benchmark: 0 };
  }

  let benchmark = platformBenchmark.avgEngagementRate;
  if (industryData) {
    const key = `${platform.toLowerCase()}Engagement` as keyof IndustryBenchmark;
    const industryVal = industryData[key];
    if (typeof industryVal === "number") benchmark = industryVal;
  }

  const percentDiff = benchmark > 0 ? ((userEngagementRate - benchmark) / benchmark) * 100 : 0;

  let rating: "above" | "average" | "below" = "average";
  if (percentDiff > 20) rating = "above";
  else if (percentDiff < -20) rating = "below";

  return { rating, percentDiff: Math.round(percentDiff), benchmark };
}

/**
 * Get content recommendations based on platform benchmarks
 */
export function getContentRecommendations(platform: string): string[] {
  const benchmark = PLATFORM_BENCHMARKS[platform];
  if (!benchmark) return [];

  const tips: string[] = [];

  tips.push(`Optimal post length: ${benchmark.optimalPostLength.min}-${benchmark.optimalPostLength.max} characters`);
  tips.push(`Use ${benchmark.hashtagsRecommended.min}-${benchmark.hashtagsRecommended.max} hashtags`);
  tips.push(`Best content types: ${benchmark.bestContentTypes.join(", ")}`);
  tips.push(`Post ${benchmark.avgPostsPerWeek}x per week for optimal reach`);

  if (benchmark.videoVsImageLift > 0) {
    tips.push(`Video gets ~${benchmark.videoVsImageLift}% more engagement than images`);
  }

  return tips;
}
