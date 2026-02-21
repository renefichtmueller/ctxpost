"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Palette,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Smile,
  Hash,
  MessageSquare,
  Target,
  BookOpen,
  Settings2,
} from "lucide-react";
import { saveBrandStyle, deleteBrandStyle } from "@/actions/brand-style";

interface BrandStyleData {
  id: string;
  name: string;
  tone: string;
  formality: string;
  emojiUsage: string;
  targetAudience: string | null;
  brandVoice: string | null;
  avoidTopics: string | null;
  preferredTopics: string | null;
  hashtagStrategy: string;
  preferredHashtags: string | null;
  languages: string;
  customInstructions: string | null;
}

interface BrandStyleFormProps {
  initialData: BrandStyleData | null;
}

export function BrandStyleForm({ initialData }: BrandStyleFormProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const [name, setName] = useState(initialData?.name ?? "Standard");
  const [tone, setTone] = useState(initialData?.tone ?? "professional");
  const [formality, setFormality] = useState(initialData?.formality ?? "formal");
  const [emojiUsage, setEmojiUsage] = useState(initialData?.emojiUsage ?? "moderate");
  const [targetAudience, setTargetAudience] = useState(initialData?.targetAudience ?? "");
  const [brandVoice, setBrandVoice] = useState(initialData?.brandVoice ?? "");
  const [avoidTopics, setAvoidTopics] = useState(initialData?.avoidTopics ?? "");
  const [preferredTopics, setPreferredTopics] = useState(initialData?.preferredTopics ?? "");
  const [hashtagStrategy, setHashtagStrategy] = useState(initialData?.hashtagStrategy ?? "moderate");
  const [preferredHashtags, setPreferredHashtags] = useState(initialData?.preferredHashtags ?? "");
  const [languages, setLanguages] = useState(initialData?.languages ?? "de");
  const [customInstructions, setCustomInstructions] = useState(initialData?.customInstructions ?? "");

  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleSave = () => {
    setSaveMessage(null);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("tone", tone);
    formData.set("formality", formality);
    formData.set("emojiUsage", emojiUsage);
    formData.set("targetAudience", targetAudience);
    formData.set("brandVoice", brandVoice);
    formData.set("avoidTopics", avoidTopics);
    formData.set("preferredTopics", preferredTopics);
    formData.set("hashtagStrategy", hashtagStrategy);
    formData.set("preferredHashtags", preferredHashtags);
    formData.set("languages", languages);
    formData.set("customInstructions", customInstructions);

    startTransition(async () => {
      const result = await saveBrandStyle(formData);
      if (result?.error) {
        setSaveMessage({ type: "error", text: result.error });
      } else {
        setSaveMessage({ type: "success", text: t("brandStyleSaved") });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    });
  };

  const handleDelete = () => {
    if (!initialData) return;
    setSaveMessage(null);

    startDeleteTransition(async () => {
      const result = await deleteBrandStyle();
      if (result?.error) {
        setSaveMessage({ type: "error", text: result.error });
      } else {
        // Reset to defaults
        setName("Standard");
        setTone("professional");
        setFormality("formal");
        setEmojiUsage("moderate");
        setTargetAudience("");
        setBrandVoice("");
        setAvoidTopics("");
        setPreferredTopics("");
        setHashtagStrategy("moderate");
        setPreferredHashtags("");
        setLanguages("de");
        setCustomInstructions("");
        setSaveMessage({ type: "success", text: t("brandStyleReset") });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          {t("brandStyle")}
        </CardTitle>
        <CardDescription>
          {t("brandStyleDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="brandName">{t("brandName")}</Label>
          <Input
            id="brandName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("brandNamePlaceholder")}
          />
        </div>

        {/* Ton & Formalität */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              {t("tone")}
            </Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">{t("toneProfessional")}</SelectItem>
                <SelectItem value="casual">{t("toneCasual")}</SelectItem>
                <SelectItem value="humorous">{t("toneHumorous")}</SelectItem>
                <SelectItem value="inspiring">{t("toneInspirational")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              {t("formality")}
            </Label>
            <Select value={formality} onValueChange={setFormality}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">{t("formalitySie")}</SelectItem>
                <SelectItem value="semi-formal">{t("formalitySemiDu")}</SelectItem>
                <SelectItem value="informal">{t("formalityDu")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Emojis & Hashtags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Smile className="h-3.5 w-3.5 text-muted-foreground" />
              {t("emojiUsage")}
            </Label>
            <Select value={emojiUsage} onValueChange={setEmojiUsage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("emojiNone")}</SelectItem>
                <SelectItem value="minimal">{t("emojiMinimal")}</SelectItem>
                <SelectItem value="moderate">{t("emojiModerate")}</SelectItem>
                <SelectItem value="heavy">{t("emojiHeavy")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              {t("hashtagStrategy")}
            </Label>
            <Select value={hashtagStrategy} onValueChange={setHashtagStrategy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("hashtagNone")}</SelectItem>
                <SelectItem value="minimal">{t("hashtagFew")}</SelectItem>
                <SelectItem value="moderate">{t("hashtagModerate")}</SelectItem>
                <SelectItem value="aggressive">{t("hashtagMany")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sprache */}
        <div className="space-y-2">
          <Label>{t("mainLanguage")}</Label>
          <Select value={languages} onValueChange={setLanguages}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="de">{t("langDe")}</SelectItem>
              <SelectItem value="en">{t("langEn")}</SelectItem>
              <SelectItem value="de,en">{t("langDeEn")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Brand Voice */}
        <div className="space-y-2">
          <Label htmlFor="brandVoice" className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            {t("brandVoice")}
          </Label>
          <Textarea
            id="brandVoice"
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            placeholder={t("brandVoicePlaceholder")}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {t("brandVoiceHint")}
          </p>
        </div>

        {/* Zielgruppe */}
        <div className="space-y-2">
          <Label htmlFor="targetAudience" className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            {t("targetAudience")}
          </Label>
          <Textarea
            id="targetAudience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder={t("targetAudiencePlaceholder")}
            rows={2}
          />
        </div>

        {/* Bevorzugte Themen */}
        <div className="space-y-2">
          <Label htmlFor="preferredTopics">{t("preferredTopics")}</Label>
          <Textarea
            id="preferredTopics"
            value={preferredTopics}
            onChange={(e) => setPreferredTopics(e.target.value)}
            placeholder={t("preferredTopicsPlaceholder")}
            rows={2}
          />
        </div>

        {/* Zu vermeidende Themen */}
        <div className="space-y-2">
          <Label htmlFor="avoidTopics">{t("avoidTopics")}</Label>
          <Textarea
            id="avoidTopics"
            value={avoidTopics}
            onChange={(e) => setAvoidTopics(e.target.value)}
            placeholder={t("avoidTopicsPlaceholder")}
            rows={2}
          />
        </div>

        {/* Bevorzugte Hashtags */}
        <div className="space-y-2">
          <Label htmlFor="preferredHashtags" className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            {t("preferredHashtags")}
          </Label>
          <Textarea
            id="preferredHashtags"
            value={preferredHashtags}
            onChange={(e) => setPreferredHashtags(e.target.value)}
            placeholder={t("preferredHashtagsPlaceholder")}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            {t("preferredHashtagsHint")}
          </p>
        </div>

        {/* Custom Instructions */}
        <div className="space-y-2">
          <Label htmlFor="customInstructions" className="flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
            {t("customInstructions")}
          </Label>
          <Textarea
            id="customInstructions"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder={t("customInstructionsPlaceholder")}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={isPending || isDeleting} className="gap-2">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {tCommon("loading")}
              </>
            ) : (
              t("saveBrandStyle")
            )}
          </Button>

          {initialData && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isPending || isDeleting}
              className="gap-2 text-destructive hover:text-destructive"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t("resetBrandStyle")}
            </Button>
          )}

          {saveMessage && (
            <div
              className={`flex items-center gap-1 text-sm ${
                saveMessage.type === "success" ? "text-green-600" : "text-destructive"
              }`}
            >
              {saveMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {saveMessage.text}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
