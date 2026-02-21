"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, Grid, List, Trash2, Tag, Image as ImageIcon, Film, FileText } from "lucide-react";
import { createMediaAsset, deleteMediaAsset, updateMediaAsset } from "@/actions/media-library";
import Image from "next/image";

interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  fileSize: number;
  tags: string[];
  altText?: string | null;
  description?: string | null;
  createdAt: Date;
}

interface MediaLibraryProps {
  initialAssets: MediaAsset[];
  totalAssets: number;
  allTags: string[];
}

export function MediaLibrary({ initialAssets, totalAssets, allTags }: MediaLibraryProps) {
  const t = useTranslations("library");
  const tCommon = useTranslations("common");
  const [assets, setAssets] = useState(initialAssets);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [newTag, setNewTag] = useState("");

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      !search ||
      asset.filename.toLowerCase().includes(search.toLowerCase()) ||
      asset.description?.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !selectedTag || asset.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) continue;

        const { url } = await res.json();
        const result = await createMediaAsset({
          filename: file.name,
          url,
          mimeType: file.type,
          fileSize: file.size,
        });

        if (result.asset) {
          setAssets((prev) => [result.asset as MediaAsset, ...prev]);
        }
      }
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = (assetId: string) => {
    startTransition(async () => {
      await deleteMediaAsset(assetId);
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      if (selectedAsset?.id === assetId) setSelectedAsset(null);
    });
  };

  const handleAddTag = (assetId: string) => {
    if (!newTag.trim()) return;
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;
    const updatedTags = [...new Set([...asset.tags, newTag.trim()])];
    startTransition(async () => {
      await updateMediaAsset(assetId, { tags: updatedTags });
      setAssets((prev) =>
        prev.map((a) => (a.id === assetId ? { ...a, tags: updatedTags } : a))
      );
      setNewTag("");
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (mimeType.startsWith("video/")) return <Film className="h-8 w-8 text-purple-500" />;
    return <FileText className="h-8 w-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchAssets")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <label>
          <Button asChild disabled={isUploading} className="cursor-pointer gap-2">
            <span>
              <Upload className="h-4 w-4" />
              {isUploading ? t("uploading") : t("upload")}
            </span>
          </Button>
          <input
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.docx,.pptx"
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={!selectedTag ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedTag(null)}
          >
            {tCommon("all")}
          </Badge>
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Asset Grid/List */}
      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{t("noAssets")}</h3>
            <p className="text-sm text-muted-foreground">{t("noAssetsDesc")}</p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              className={`group relative cursor-pointer transition-all hover:ring-2 hover:ring-primary/30 ${
                selectedAsset?.id === asset.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedAsset(asset)}
            >
              <CardContent className="p-2">
                <div className="aspect-square relative rounded overflow-hidden bg-muted mb-2">
                  {asset.mimeType.startsWith("image/") ? (
                    <Image
                      src={asset.url}
                      alt={asset.altText || asset.filename}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {getFileIcon(asset.mimeType)}
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(asset.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs truncate">{asset.filename}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(asset.fileSize)}</p>
                {asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {asset.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1">
                        {tag}
                      </Badge>
                    ))}
                    {asset.tags.length > 2 && (
                      <Badge variant="secondary" className="text-[10px] px-1">
                        +{asset.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              className={`cursor-pointer hover:bg-muted/30 transition-colors ${
                selectedAsset?.id === asset.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedAsset(asset)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
                  {asset.mimeType.startsWith("image/") ? (
                    <Image
                      src={asset.url}
                      alt={asset.altText || asset.filename}
                      width={48}
                      height={48}
                      className="object-cover h-full w-full"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {getFileIcon(asset.mimeType)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate font-medium">{asset.filename}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(asset.fileSize)}</p>
                </div>
                {asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(asset.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {t("assetCount", { count: filteredAssets.length, total: totalAssets })}
      </p>
    </div>
  );
}
