export const locales = ["de", "en", "fr", "pt", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "de";

export const localeNames: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  fr: "Français",
  pt: "Português",
  es: "Español",
};
