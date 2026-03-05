"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";

export function RefreshFacebookPagesButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleRefresh() {
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/social/facebook/refresh-pages", { method: "POST" });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message);
        // Reload after 1.5s so the new page appears
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setStatus("error");
        setMessage(data.error || "Unbekannter Fehler");
      }
    } catch {
      setStatus("error");
      setMessage("Netzwerkfehler");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={status === "loading" || status === "success"}
        className="gap-1.5 text-xs h-7"
        style={{
          borderColor: "rgba(24,119,242,0.3)",
          color: "#60a5fa",
          background: "rgba(24,119,242,0.06)",
        }}
      >
        <RefreshCw
          className={`h-3 w-3 ${status === "loading" ? "animate-spin" : ""}`}
        />
        {status === "loading"
          ? "Wird geladen…"
          : status === "success"
          ? "Aktualisiert!"
          : "Seiten aktualisieren"}
        {status === "success" && <CheckCircle2 className="h-3 w-3 text-green-400" />}
        {status === "error" && <AlertTriangle className="h-3 w-3 text-red-400" />}
      </Button>
      {message && (
        <p
          className="text-xs px-1"
          style={{ color: status === "error" ? "#f87171" : "#34d399" }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
