"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Film } from "lucide-react";
import Image from "next/image";

interface MediaUploadProps {
  mediaUrls: string[];
  onMediaUrlsChange: (urls: string[]) => void;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const MAX_FILE_SIZE_IMAGE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE_LARGE = 100 * 1024 * 1024; // 100MB for video/docs
const MAX_FILES = 4;

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov)$/i.test(url);
}

function isDocUrl(url: string): boolean {
  return /\.(pdf|docx|pptx)$/i.test(url);
}

function getMaxSizeForType(type: string): number {
  if (type.startsWith("video/") || type.startsWith("application/vnd.")) {
    return MAX_FILE_SIZE_LARGE;
  }
  return MAX_FILE_SIZE_IMAGE;
}

export function MediaUpload({
  mediaUrls,
  onMediaUrlsChange,
}: MediaUploadProps) {
  const t = useTranslations("media");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t("invalidType", { type: file.type }));
      return null;
    }

    if (file.size > getMaxSizeForType(file.type)) {
      setError(t("tooLarge", { name: file.name }));
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || t("uploadError"));
    }

    const data = await response.json();
    return data.url as string;
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = MAX_FILES - mediaUrls.length;

      if (remaining <= 0) {
        setError(t("maxFilesReached", { maxFiles: MAX_FILES }));
        return;
      }

      const filesToUpload = fileArray.slice(0, remaining);
      if (fileArray.length > remaining) {
        setError(
          t("filesIgnored", {
            remaining,
            ignored: fileArray.length - remaining,
          })
        );
      } else {
        setError(null);
      }

      setIsUploading(true);
      const newUrls: string[] = [];

      try {
        for (const file of filesToUpload) {
          const url = await uploadFile(file);
          if (url) {
            newUrls.push(url);
          }
        }

        if (newUrls.length > 0) {
          onMediaUrlsChange([...mediaUrls, ...newUrls]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("uploadError")
        );
      } finally {
        setIsUploading(false);
      }
    },
    [mediaUrls, onMediaUrlsChange, t]
  );

  const handleRemove = (index: number) => {
    const updated = mediaUrls.filter((_, i) => i !== index);
    onMediaUrlsChange(updated);
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset value so the same file can be selected again
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Upload className="h-4 w-4" style={{ color: "#22d3ee" }} />
        <span className="font-semibold text-sm text-white">{t("title")}</span>
        <span className="text-xs" style={{ color: "#94a3b8" }}>— {t("description", { maxFiles: MAX_FILES })}</span>
      </div>

      {/* Drop zone */}
      {mediaUrls.length < MAX_FILES && (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          style={{
            borderColor: isDragOver ? "#22d3ee" : "rgba(34,211,238,0.2)",
            background: isDragOver ? "rgba(34,211,238,0.06)" : "rgba(255,255,255,0.02)",
          }}
        >
          <Upload className="h-7 w-7" style={{ color: isDragOver ? "#22d3ee" : "#475569" }} />
          <div className="text-center">
            <p className="text-sm font-medium text-white">
              {isUploading ? t("uploading") : t("dropHere")}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{t("fileTypes")}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.mp4,.mov,.docx,.pptx"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {/* Previews */}
      {mediaUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {mediaUrls.map((url, index) => (
            <div
              key={url}
              className="relative group rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(34,211,238,0.15)" }}
            >
                {isImageUrl(url) ? (
                  <div className="relative aspect-video">
                    <Image
                      src={url}
                      alt={t("mediaItem", { index: index + 1 })}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : isVideoUrl(url) ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-6 px-4">
                    <Film className="h-10 w-10 text-blue-500" />
                    <span className="text-xs text-muted-foreground truncate max-w-full">
                      {url.split("/").pop() || t("videoLabel")}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-6 px-4">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate max-w-full">
                      {url.endsWith(".pdf") ? t("pdfLabel") : url.endsWith(".docx") ? t("docxLabel") : url.endsWith(".pptx") ? t("pptxLabel") : t("pdfDocument")}
                    </span>
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1.5 right-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
