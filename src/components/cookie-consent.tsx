"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "cookie-consent-acknowledged";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const t = useTranslations("gdpr");

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, new Date().toISOString());
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      role="dialog"
      aria-label={t("cookieBannerTitle")}
    >
      <div
        className="max-w-2xl mx-auto rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{
          background: "rgba(13, 20, 36, 0.95)",
          border: "1px solid rgba(168, 85, 247, 0.2)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 -4px 30px rgba(0, 0, 0, 0.4)",
        }}
      >
        <Cookie className="w-5 h-5 shrink-0" style={{ color: "#a855f7" }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white mb-1">{t("cookieBannerTitle")}</p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            {t("cookieBannerText")}{" "}
            <Link href="/privacy" className="underline" style={{ color: "#a855f7" }}>
              {t("cookieMoreInfo")}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAccept}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            }}
          >
            {t("cookieAccept")}
          </button>
          <button
            onClick={handleAccept}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            aria-label="Close"
          >
            <X className="w-4 h-4" style={{ color: "#94a3b8" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
