"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { bulkCreatePosts } from "@/actions/posts";

interface BulkImportProps {
  socialAccounts: Array<{
    id: string;
    platform: string;
    accountName: string;
  }>;
}

interface ParsedRow {
  content: string;
  scheduledAt?: string;
  platforms?: string;
  status: string;
  valid: boolean;
  error?: string;
}

export function BulkImport({ socialAccounts }: BulkImportProps) {
  const t = useTranslations("posts");
  const tCommon = useTranslations("common");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ created: number; errors: number } | null>(null);

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const contentIdx = headers.indexOf("content");
    const dateIdx = headers.indexOf("date");
    const platformIdx = headers.indexOf("platforms");
    const statusIdx = headers.indexOf("status");

    if (contentIdx === -1) return [];

    return lines.slice(1).map((line) => {
      const fields: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          fields.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      fields.push(current.trim());

      const content = fields[contentIdx]?.replace(/^"|"$/g, "") || "";
      const scheduledAt = dateIdx >= 0 ? fields[dateIdx]?.replace(/^"|"$/g, "") : undefined;
      const platforms = platformIdx >= 0 ? fields[platformIdx]?.replace(/^"|"$/g, "") : undefined;
      const status = statusIdx >= 0 ? fields[statusIdx]?.replace(/^"|"$/g, "").toUpperCase() : "DRAFT";

      const valid = content.length > 0 && content.length <= 5000;
      const error = !content ? t("contentRequired") : content.length > 5000 ? t("contentTooLong") : undefined;

      return { content, scheduledAt, platforms, status: status === "SCHEDULED" ? "SCHEDULED" : "DRAFT", valid, error };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRows(parseCSV(text));
      setResult(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = () => {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    startTransition(async () => {
      const res = await bulkCreatePosts(
        validRows.map((r) => ({
          content: r.content,
          scheduledAt: r.scheduledAt || null,
          status: r.status as "DRAFT" | "SCHEDULED",
          targetAccountIds: r.platforms
            ? socialAccounts
                .filter((a) => r.platforms!.toUpperCase().includes(a.platform))
                .map((a) => a.id)
            : socialAccounts.map((a) => a.id),
        }))
      );
      setResult(res);
    });
  };

  const downloadTemplate = () => {
    const csv = 'content,date,platforms,status\n"Your post content here",2025-03-15T10:00,"FACEBOOK,LINKEDIN",SCHEDULED\n"Another post",,,DRAFT\n';
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "social-scheduler-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("csvUpload")}</CardTitle>
          <CardDescription>{t("csvUploadDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <label>
              <Button asChild variant="outline" className="cursor-pointer gap-2">
                <span>
                  <Upload className="h-4 w-4" />
                  {t("selectCSV")}
                </span>
              </Button>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <Button variant="ghost" className="gap-2" onClick={downloadTemplate}>
              <Download className="h-4 w-4" />
              {t("downloadTemplate")}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>{t("csvFormat")}</p>
            <code className="block bg-muted px-3 py-2 rounded text-[11px]">
              content,date,platforms,status
            </code>
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("previewImport")}</CardTitle>
            <CardDescription>
              {t("importSummary", { valid: validCount, invalid: invalidCount, total: rows.length })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    row.valid ? "border-border" : "border-destructive/30 bg-destructive/5"
                  }`}
                >
                  {row.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{row.content || t("emptyContent")}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {row.scheduledAt && <Badge variant="secondary" className="text-xs">{row.scheduledAt}</Badge>}
                      <Badge variant="outline" className="text-xs">{row.status}</Badge>
                      {row.error && <span className="text-xs text-destructive">{row.error}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <Button variant="outline" onClick={() => setRows([])}>{tCommon("cancel")}</Button>
              <Button onClick={handleImport} disabled={validCount === 0 || isPending} className="gap-2">
                <FileText className="h-4 w-4" />
                {isPending ? tCommon("loading") : t("importPosts", { count: validCount })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardContent className="py-6 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="font-medium">{t("importComplete")}</p>
            <p className="text-sm text-muted-foreground">
              {t("importResult", { created: result.created, errors: result.errors })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
