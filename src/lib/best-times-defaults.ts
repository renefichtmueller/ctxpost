/**
 * Default best posting times per platform based on industry research
 * Sources: Buffer, Sprout Social, HubSpot social media studies
 *
 * Times are in 24-hour format (HH:MM), UTC-agnostic (apply user's timezone)
 * Scores: 0.0 (worst) to 1.0 (best) engagement probability
 */

export interface BestTimeSlot {
  day: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  hour: number; // 0-23
  score: number; // 0.0-1.0
}

export interface PlatformBestTimes {
  bestSlots: BestTimeSlot[];
  peakDays: number[]; // Day numbers with highest engagement
  peakHours: number[]; // Hours with highest engagement
  worstHours: number[]; // Hours with lowest engagement
}

// Facebook: Best Wed 11:00, Tue-Thu 8:00-15:00
const FACEBOOK_BEST_TIMES: PlatformBestTimes = {
  bestSlots: [
    // Wednesday - best day
    { day: 3, hour: 9, score: 0.85 },
    { day: 3, hour: 10, score: 0.90 },
    { day: 3, hour: 11, score: 0.95 },
    { day: 3, hour: 12, score: 0.85 },
    { day: 3, hour: 13, score: 0.80 },
    // Tuesday
    { day: 2, hour: 9, score: 0.80 },
    { day: 2, hour: 10, score: 0.85 },
    { day: 2, hour: 11, score: 0.85 },
    { day: 2, hour: 13, score: 0.75 },
    // Thursday
    { day: 4, hour: 9, score: 0.80 },
    { day: 4, hour: 10, score: 0.85 },
    { day: 4, hour: 11, score: 0.85 },
    { day: 4, hour: 13, score: 0.75 },
    // Friday
    { day: 5, hour: 10, score: 0.70 },
    { day: 5, hour: 11, score: 0.75 },
    // Monday
    { day: 1, hour: 10, score: 0.70 },
    { day: 1, hour: 11, score: 0.70 },
  ],
  peakDays: [2, 3, 4], // Tue, Wed, Thu
  peakHours: [9, 10, 11, 13],
  worstHours: [23, 0, 1, 2, 3, 4, 5],
};

// LinkedIn: Best Tue-Thu 10:00-12:00
const LINKEDIN_BEST_TIMES: PlatformBestTimes = {
  bestSlots: [
    // Tuesday - best day
    { day: 2, hour: 8, score: 0.80 },
    { day: 2, hour: 9, score: 0.85 },
    { day: 2, hour: 10, score: 0.95 },
    { day: 2, hour: 11, score: 0.90 },
    { day: 2, hour: 12, score: 0.80 },
    // Wednesday
    { day: 3, hour: 9, score: 0.85 },
    { day: 3, hour: 10, score: 0.90 },
    { day: 3, hour: 11, score: 0.85 },
    { day: 3, hour: 12, score: 0.80 },
    // Thursday
    { day: 4, hour: 9, score: 0.80 },
    { day: 4, hour: 10, score: 0.90 },
    { day: 4, hour: 11, score: 0.85 },
    // Monday
    { day: 1, hour: 9, score: 0.70 },
    { day: 1, hour: 10, score: 0.75 },
    { day: 1, hour: 11, score: 0.70 },
  ],
  peakDays: [2, 3, 4], // Tue, Wed, Thu
  peakHours: [9, 10, 11, 12],
  worstHours: [20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6],
};

// Twitter/X: Best Mon-Fri 8:00-11:00
const TWITTER_BEST_TIMES: PlatformBestTimes = {
  bestSlots: [
    { day: 1, hour: 8, score: 0.80 },
    { day: 1, hour: 9, score: 0.90 },
    { day: 1, hour: 10, score: 0.85 },
    { day: 2, hour: 9, score: 0.90 },
    { day: 2, hour: 10, score: 0.85 },
    { day: 3, hour: 9, score: 0.85 },
    { day: 3, hour: 10, score: 0.80 },
    { day: 4, hour: 9, score: 0.85 },
    { day: 4, hour: 10, score: 0.80 },
    { day: 5, hour: 9, score: 0.80 },
    { day: 5, hour: 10, score: 0.75 },
  ],
  peakDays: [1, 2, 3, 4, 5], // Mon-Fri
  peakHours: [8, 9, 10, 11],
  worstHours: [22, 23, 0, 1, 2, 3, 4, 5],
};

// Instagram: Best Thu 9:00, Wed 12:00 and 18:00
const INSTAGRAM_BEST_TIMES: PlatformBestTimes = {
  bestSlots: [
    // Thursday - best day
    { day: 4, hour: 9, score: 0.95 },
    { day: 4, hour: 11, score: 0.80 },
    { day: 4, hour: 14, score: 0.75 },
    // Wednesday
    { day: 3, hour: 9, score: 0.80 },
    { day: 3, hour: 12, score: 0.90 },
    { day: 3, hour: 18, score: 0.85 },
    // Friday
    { day: 5, hour: 9, score: 0.75 },
    { day: 5, hour: 11, score: 0.75 },
    // Tuesday
    { day: 2, hour: 9, score: 0.70 },
    { day: 2, hour: 18, score: 0.70 },
    // Monday
    { day: 1, hour: 9, score: 0.65 },
    { day: 1, hour: 18, score: 0.65 },
  ],
  peakDays: [3, 4, 5], // Wed, Thu, Fri
  peakHours: [9, 11, 12, 18],
  worstHours: [23, 0, 1, 2, 3, 4, 5],
};

// Threads: Similar to Instagram
const THREADS_BEST_TIMES: PlatformBestTimes = INSTAGRAM_BEST_TIMES;

export const PLATFORM_BEST_TIMES: Record<string, PlatformBestTimes> = {
  FACEBOOK: FACEBOOK_BEST_TIMES,
  LINKEDIN: LINKEDIN_BEST_TIMES,
  TWITTER: TWITTER_BEST_TIMES,
  INSTAGRAM: INSTAGRAM_BEST_TIMES,
  THREADS: THREADS_BEST_TIMES,
};

/**
 * Find the next best time slot for a given set of platforms.
 * Returns a Date object for the recommended time.
 *
 * @param platforms - Array of platform keys (e.g., ["FACEBOOK", "LINKEDIN"])
 * @param fromDate - Start searching from this date (default: now)
 * @param minHoursAhead - Minimum hours in the future (default: 1)
 */
export function getNextBestTime(
  platforms: string[],
  fromDate: Date = new Date(),
  minHoursAhead: number = 1
): { date: Date; score: number; reason: string } {
  // Collect all relevant time slots across platforms
  const allSlots: Array<BestTimeSlot & { platform: string }> = [];
  for (const platform of platforms) {
    const times = PLATFORM_BEST_TIMES[platform];
    if (times) {
      for (const slot of times.bestSlots) {
        allSlots.push({ ...slot, platform });
      }
    }
  }

  if (allSlots.length === 0) {
    // Fallback: tomorrow at 10:00
    const fallback = new Date(fromDate);
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(10, 0, 0, 0);
    return { date: fallback, score: 0.5, reason: "Default time (no platform data)" };
  }

  // For multi-platform posts, average scores across platforms for each day+hour combination
  const combinedSlots = new Map<string, { day: number; hour: number; totalScore: number; count: number }>();
  for (const slot of allSlots) {
    const key = `${slot.day}-${slot.hour}`;
    const existing = combinedSlots.get(key);
    if (existing) {
      existing.totalScore += slot.score;
      existing.count += 1;
    } else {
      combinedSlots.set(key, { day: slot.day, hour: slot.hour, totalScore: slot.score, count: 1 });
    }
  }

  // Sort by average score (prefer slots that are good for all platforms)
  const rankedSlots = Array.from(combinedSlots.values())
    .map((s) => ({ ...s, avgScore: s.totalScore / s.count }))
    .sort((a, b) => {
      // Prefer slots that cover more platforms
      if (b.count !== a.count) return b.count - a.count;
      return b.avgScore - a.avgScore;
    });

  // Find the next occurrence of each ranked slot
  const minDate = new Date(fromDate.getTime() + minHoursAhead * 60 * 60 * 1000);

  for (const slot of rankedSlots) {
    const candidate = getNextOccurrence(slot.day, slot.hour, minDate);
    if (candidate) {
      const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return {
        date: candidate,
        score: slot.avgScore,
        reason: `${DAY_NAMES[slot.day]} ${slot.hour}:00 - optimal for ${platforms.join(", ")}`,
      };
    }
  }

  // Fallback: use top slot, find next occurrence
  const topSlot = rankedSlots[0];
  const fallbackDate = getNextOccurrence(topSlot.day, topSlot.hour, minDate) || minDate;
  return { date: fallbackDate, score: topSlot.avgScore, reason: "Next available optimal slot" };
}

/**
 * Get the next occurrence of a specific weekday and hour from a given start date.
 */
function getNextOccurrence(targetDay: number, targetHour: number, from: Date): Date {
  const result = new Date(from);
  result.setMinutes(0, 0, 0);

  // Try the current day first
  if (result.getDay() === targetDay && result.getHours() <= targetHour) {
    result.setHours(targetHour);
    if (result > from) return result;
  }

  // Find next occurrence
  let daysAhead = (targetDay - from.getDay() + 7) % 7;
  if (daysAhead === 0) daysAhead = 7; // If same day but hour passed, go to next week

  result.setDate(from.getDate() + daysAhead);
  result.setHours(targetHour, 0, 0, 0);
  return result;
}
