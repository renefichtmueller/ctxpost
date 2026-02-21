"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface TestPublishButtonProps {
  accountId: string;
  accountName: string;
}

export function TestPublishButton({ accountId, accountName }: TestPublishButtonProps) {
  const t = useTranslations("accounts");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTest = async () => {
    setStatus("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/social/test-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setErrorMsg(data.error || t("testFailed"));
        setTimeout(() => {
          setStatus("idle");
          setErrorMsg(null);
        }, 5000);
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : t("testFailed"));
      setTimeout(() => {
        setStatus("idle");
        setErrorMsg(null);
      }, 5000);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-1 text-xs"
        onClick={handleTest}
        disabled={status === "loading"}
        title={errorMsg || t("testPublish")}
      >
        {status === "loading" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : status === "success" ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : status === "error" ? (
          <X className="h-3 w-3 text-red-600" />
        ) : (
          <Send className="h-3 w-3" />
        )}
        {status === "success" ? t("testSuccess") :
         status === "error" ? t("testFailed") :
         t("testPublish")}
      </Button>
      {errorMsg && status === "error" && (
        <div className="absolute top-full right-0 mt-1 z-10 max-w-xs p-2 text-xs text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md shadow-sm">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
