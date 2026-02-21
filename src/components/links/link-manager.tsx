"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link2, Copy, Trash2, Plus, BarChart3 } from "lucide-react";
import { createShortLink, deleteShortLink } from "@/actions/short-links";

interface ShortLink {
  id: string;
  originalUrl: string;
  shortCode: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  clicks: number;
  createdAt: Date;
}

interface LinkManagerProps {
  initialLinks: ShortLink[];
}

export function LinkManager({ initialLinks }: LinkManagerProps) {
  const t = useTranslations("links");
  const tCommon = useTranslations("common");
  const [links, setLinks] = useState(initialLinks);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleCreate = () => {
    if (!url) return;
    startTransition(async () => {
      const result = await createShortLink({
        url,
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined,
      });
      if (result.link) {
        setLinks((prev) => [result.link as ShortLink, ...prev]);
        setUrl("");
        setUtmSource("");
        setUtmMedium("");
        setUtmCampaign("");
        setShowForm(false);
      }
    });
  };

  const handleDelete = (linkId: string) => {
    startTransition(async () => {
      await deleteShortLink(linkId);
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    });
  };

  const copyLink = (shortCode: string) => {
    const shortUrl = `${baseUrl}/api/s/${shortCode}`;
    navigator.clipboard.writeText(shortUrl);
    setCopied(shortCode);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("createLink")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t("newLink")}</CardTitle>
            <CardDescription>{t("newLinkDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("originalUrl")}</Label>
              <Input
                placeholder="https://example.com/page"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>UTM Source</Label>
                <Input
                  placeholder="social"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>UTM Medium</Label>
                <Input
                  placeholder="post"
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>UTM Campaign</Label>
                <Input
                  placeholder="spring2025"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>{tCommon("cancel")}</Button>
              <Button onClick={handleCreate} disabled={!url || isPending} className="gap-2">
                <Link2 className="h-4 w-4" />
                {t("shorten")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {links.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{t("noLinks")}</h3>
            <p className="text-sm text-muted-foreground">{t("noLinksDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <Card key={link.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Link2 className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-medium text-primary">
                      /api/s/{link.shortCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyLink(link.shortCode)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {copied === link.shortCode && (
                      <span className="text-xs text-green-600">{tCommon("copied")}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{link.originalUrl}</p>
                  <div className="flex gap-2 mt-1">
                    {link.utmSource && <Badge variant="secondary" className="text-[10px]">{link.utmSource}</Badge>}
                    {link.utmMedium && <Badge variant="secondary" className="text-[10px]">{link.utmMedium}</Badge>}
                    {link.utmCampaign && <Badge variant="secondary" className="text-[10px]">{link.utmCampaign}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    {link.clicks}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(link.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
