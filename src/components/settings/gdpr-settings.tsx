"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Shield,
  Download,
  Trash2,
  FileCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface ConsentInfo {
  privacyConsentAt: string | null;
  termsConsentAt: string | null;
  consentVersion: string | null;
}

interface AuditEntry {
  action: string;
  createdAt: string;
  ipAddress: string | null;
}

export function GdprSettings({
  consent,
  recentAudit,
  locale,
}: {
  consent: ConsentInfo;
  recentAudit: AuditEntry[];
  locale: string;
}) {
  const t = useTranslations("gdpr");
  const router = useRouter();
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleExport() {
    setExportLoading(true);
    try {
      const res = await fetch("/api/user/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ctxpost-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("exportDataSuccess"));
    } catch {
      toast.error(t("exportDataError"));
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== "DELETE") return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(t("deleteAccountSuccess"));
      router.push("/login");
    } catch {
      toast.error(t("deleteAccountError"));
    } finally {
      setDeleteLoading(false);
    }
  }

  const cardStyle = {
    background: "#0d1424",
    border: "1px solid rgba(168, 85, 247, 0.15)",
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const actionLabels: Record<string, string> = {
    LOGIN: "Login",
    LOGOUT: "Logout",
    REGISTER: "Registration",
    DATA_EXPORT: "Data Export",
    ACCOUNT_DELETE: "Account Deletion",
    CONSENT_CHANGE: "Consent Change",
    PASSWORD_CHANGE: "Password Change",
    SOCIAL_CONNECT: "Social Account Connected",
    SOCIAL_DISCONNECT: "Social Account Disconnected",
    SETTINGS_CHANGE: "Settings Changed",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card style={cardStyle}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5" style={{ color: "#22d3ee" }} />
            {t("dataPrivacy")}
          </CardTitle>
          <CardDescription style={{ color: "#94a3b8" }}>
            {t("dataPrivacyDesc")}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Consent Management */}
      <Card style={cardStyle}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <FileCheck className="h-5 w-5" style={{ color: "#a855f7" }} />
            {t("consentManagement")}
          </CardTitle>
          <CardDescription style={{ color: "#94a3b8" }}>
            {t("consentManagementDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Privacy Policy Consent */}
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(168,85,247,0.1)",
            }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#34d399" }} />
              <div>
                <p className="text-sm font-medium text-white">{t("privacyPolicyConsent")}</p>
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  {t("consentDate")}: {formatDate(consent.privacyConsentAt)}
                  {consent.consentVersion && ` · ${t("consentVersion")}: ${consent.consentVersion}`}
                </p>
              </div>
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34d399" }}
            >
              {t("consentGranted")}
            </span>
          </div>

          {/* Terms Consent */}
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(168,85,247,0.1)",
            }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#34d399" }} />
              <div>
                <p className="text-sm font-medium text-white">{t("termsConsent")}</p>
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  {t("consentDate")}: {formatDate(consent.termsConsentAt)}
                </p>
              </div>
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34d399" }}
            >
              {t("consentGranted")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card style={cardStyle}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Download className="h-5 w-5" style={{ color: "#22d3ee" }} />
            {t("exportData")}
          </CardTitle>
          <CardDescription style={{ color: "#94a3b8" }}>
            {t("exportDataDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExport}
            disabled={exportLoading}
            className="font-medium"
            style={{
              background: "rgba(34, 211, 238, 0.1)",
              border: "1px solid rgba(34, 211, 238, 0.3)",
              color: "#22d3ee",
            }}
          >
            {exportLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("exportDataLoading")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                {t("exportDataButton")}
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Audit Log */}
      {recentAudit.length > 0 && (
        <Card style={cardStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <Clock className="h-5 w-5" style={{ color: "#fbbf24" }} />
              {t("auditLog")}
            </CardTitle>
            <CardDescription style={{ color: "#94a3b8" }}>
              {t("auditLogDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentAudit.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-lg text-xs"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(168,85,247,0.05)",
                  }}
                >
                  <span className="text-white font-medium">
                    {actionLabels[entry.action] || entry.action}
                  </span>
                  <span style={{ color: "#94a3b8" }}>
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Deletion */}
      <Card style={{ ...cardStyle, borderColor: "rgba(239, 68, 68, 0.3)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400 text-lg">
            <Trash2 className="h-5 w-5" />
            {t("deleteAccount")}
          </CardTitle>
          <CardDescription style={{ color: "#94a3b8" }}>
            {t("deleteAccountDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="destructive"
              className="font-medium"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {t("deleteAccountButton")}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-400">{t("deleteAccountConfirm")}</p>
              <div className="flex gap-2">
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="max-w-[200px] text-white"
                  style={{
                    background: "rgba(239, 68, 68, 0.05)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                  }}
                />
                <Button
                  onClick={handleDelete}
                  disabled={deleteConfirm !== "DELETE" || deleteLoading}
                  variant="destructive"
                >
                  {deleteLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t("deleteAccountButton")
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirm("");
                  }}
                  variant="outline"
                  className="text-white"
                  style={{ border: "1px solid rgba(168,85,247,0.2)" }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
