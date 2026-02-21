export const PLATFORMS = {
  FACEBOOK: {
    name: "Facebook",
    color: "#1877F2",
    icon: "facebook",
    charLimit: 63206,
    imageRatio: "1200×630 (1.91:1)",
    optimalImageSize: { w: 1200, h: 630 },
  },
  LINKEDIN: {
    name: "LinkedIn",
    color: "#0A66C2",
    icon: "linkedin",
    charLimit: 3000,
    imageRatio: "1200×627 (1.91:1)",
    optimalImageSize: { w: 1200, h: 627 },
  },
  TWITTER: {
    name: "X / Twitter",
    color: "#000000",
    icon: "twitter",
    charLimit: 280,
    imageRatio: "1600×900 (16:9)",
    optimalImageSize: { w: 1600, h: 900 },
  },
  INSTAGRAM: {
    name: "Instagram",
    color: "#E4405F",
    icon: "instagram",
    charLimit: 2200,
    imageRatio: "1080×1080 (1:1)",
    optimalImageSize: { w: 1080, h: 1080 },
  },
  THREADS: {
    name: "Threads",
    color: "#000000",
    icon: "threads",
    charLimit: 500,
    imageRatio: "1080×1080 (1:1)",
    optimalImageSize: { w: 1080, h: 1080 },
  },
} as const;

// Status keys used with translations: t(`posts.${POST_STATUS_KEYS[status]}`)
export const POST_STATUS_KEYS = {
  DRAFT: "draft",
  PENDING_REVIEW: "pendingReview",
  SCHEDULED: "scheduled",
  PUBLISHING: "publishing",
  PUBLISHED: "published",
  FAILED: "failed",
} as const;

export const POST_STATUS_COLORS = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_REVIEW: "bg-orange-100 text-orange-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  PUBLISHING: "bg-yellow-100 text-yellow-800",
  PUBLISHED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
} as const;

// Optimal posting times by time-of-day category
// Labels/descriptions use translation keys from the "textGen" namespace
export const TIME_CATEGORIES = {
  morning: {
    labelKey: "morningLabel",
    descriptionKey: "morningDesc",
    hours: [6, 7, 8, 9, 10],
  },
  midday: {
    labelKey: "middayLabel",
    descriptionKey: "middayDesc",
    hours: [11, 12, 13, 14],
  },
  afternoon: {
    labelKey: "afternoonLabel",
    descriptionKey: "afternoonDesc",
    hours: [14, 15, 16, 17, 18],
  },
  evening: {
    labelKey: "eveningLabel",
    descriptionKey: "eveningDesc",
    hours: [18, 19, 20, 21, 22],
  },
  night: {
    labelKey: "nightLabel",
    descriptionKey: "nightDesc",
    hours: [22, 23, 0, 1, 2, 3, 4, 5],
  },
} as const;

// Common timezones
export const COMMON_TIMEZONES = [
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Europe/Vienna", label: "Vienna (CET/CEST)" },
  { value: "Europe/Zurich", label: "Zurich (CET/CEST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Madrid", label: "Madrid (CET/CEST)" },
  { value: "Europe/Rome", label: "Rome (CET/CEST)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
  { value: "Europe/Lisbon", label: "Lisbon (WET/WEST)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "UTC", label: "UTC" },
] as const;
