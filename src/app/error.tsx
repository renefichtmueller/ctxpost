"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
        <h2 className="text-xl font-semibold">{t("errorOccurred")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("errorUnexpected")}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            {t("errorId")}: {error.digest}
          </p>
        )}
        <Button onClick={reset} variant="default">
          {t("retry")}
        </Button>
      </div>
    </div>
  );
}
