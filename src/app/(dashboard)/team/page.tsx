import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyTeams } from "@/actions/teams";
import { TeamManager } from "@/components/team/team-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Edit3, Eye, CheckCircle2, Crown, Sparkles } from "lucide-react";

const ROLE_INFO = [
  {
    role: "OWNER",
    label: "Owner / Admin",
    icon: Crown,
    color: "#f472b6",
    bg: "rgba(244, 114, 182, 0.08)",
    border: "rgba(244, 114, 182, 0.2)",
    permissions: [
      "Vollzugriff auf alles",
      "Team verwalten & auflösen",
      "Mitglieder einladen & entfernen",
      "Rollen zuweisen",
      "Alle Beiträge erstellen, bearbeiten, löschen",
      "Posts direkt veröffentlichen",
      "KI-Modelle & API-Keys verwalten",
    ],
  },
  {
    role: "ADMIN",
    label: "Admin",
    icon: Shield,
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.08)",
    border: "rgba(168, 85, 247, 0.2)",
    permissions: [
      "Mitglieder einladen & verwalten",
      "Beiträge erstellen, bearbeiten, löschen",
      "Freigaben erteilen & ablehnen",
      "Posts schedulen & veröffentlichen",
      "Analytics einsehen",
    ],
  },
  {
    role: "EDITOR",
    label: "Scripter / Editor",
    icon: Edit3,
    color: "#22d3ee",
    bg: "rgba(34, 211, 238, 0.08)",
    border: "rgba(34, 211, 238, 0.2)",
    permissions: [
      "Beiträge erstellen & bearbeiten",
      "Posts zur Freigabe einreichen",
      "KI-Texte & Hashtags generieren",
      "Medien hochladen",
      "Entwürfe speichern",
      "KEINE direkte Veröffentlichung ohne Freigabe",
    ],
  },
  {
    role: "REVIEWER",
    label: "Poster / Moderator",
    icon: CheckCircle2,
    color: "#fb923c",
    bg: "rgba(251, 146, 60, 0.08)",
    border: "rgba(251, 146, 60, 0.2)",
    permissions: [
      "Eingereichte Posts prüfen & freigeben",
      "Posts ablehnen (mit Begründung)",
      "Freigegebene Posts veröffentlichen",
      "Analytics einsehen",
      "KEINE Beiträge selbst erstellen",
    ],
  },
  {
    role: "VIEWER",
    label: "Viewer",
    icon: Eye,
    color: "#94a3b8",
    bg: "rgba(100, 116, 139, 0.06)",
    border: "rgba(100, 116, 139, 0.15)",
    permissions: [
      "Beiträge einsehen (read-only)",
      "Analytics einsehen",
      "KEINE Bearbeitung oder Veröffentlichung",
    ],
  },
];

export default async function TeamPage() {
  const t = await getTranslations("team");
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const teams = await getMyTeams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
        <p style={{ color: "#94a3b8" }}>{t("description")}</p>
      </div>

      {/* Roles Legend */}
      <Card style={{ background: "#0d1424", border: "1px solid rgba(168, 85, 247, 0.15)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5" style={{ color: "#a855f7" }} />
            Rollenberechtigungen
          </CardTitle>
          <CardDescription style={{ color: "#94a3b8" }}>
            Wer darf was tun? Weise Mitgliedern die passende Rolle zu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROLE_INFO.map((info) => (
              <div
                key={info.role}
                className="p-4 rounded-xl space-y-3"
                style={{ background: info.bg, border: `1px solid ${info.border}` }}
              >
                <div className="flex items-center gap-2">
                  <info.icon className="h-4 w-4" style={{ color: info.color }} />
                  <span className="font-semibold text-sm text-white">{info.label}</span>
                </div>
                <ul className="space-y-1.5">
                  {info.permissions.map((perm, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-xs"
                      style={{ color: perm.startsWith("KEINE") ? "#f87171" : "#94a3b8" }}
                    >
                      <span className="mt-0.5 shrink-0" style={{ color: perm.startsWith("KEINE") ? "#f87171" : info.color }}>
                        {perm.startsWith("KEINE") ? "✕" : "✓"}
                      </span>
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Workflow Arrow */}
          <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.08)" }}>
            <p className="font-semibold mb-2 text-white">Typischer Workflow:</p>
            <div className="flex items-center gap-2 flex-wrap" style={{ color: "#94a3b8" }}>
              <span className="px-2 py-1 rounded-lg" style={{ background: "rgba(34, 211, 238, 0.12)", color: "#22d3ee" }}>Scripter schreibt</span>
              <span>→</span>
              <span className="px-2 py-1 rounded-lg" style={{ background: "rgba(34, 211, 238, 0.12)", color: "#22d3ee" }}>Reicht zur Freigabe ein</span>
              <span>→</span>
              <span className="px-2 py-1 rounded-lg" style={{ background: "rgba(251, 146, 60, 0.12)", color: "#fb923c" }}>Moderator prüft</span>
              <span>→</span>
              <span className="px-2 py-1 rounded-lg" style={{ background: "rgba(52, 211, 153, 0.12)", color: "#34d399" }}>Genehmigt & scheduliert</span>
              <span>→</span>
              <span className="px-2 py-1 rounded-lg" style={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}>Admin veröffentlicht</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <TeamManager initialTeams={teams} currentUserId={session.user.id} />
    </div>
  );
}
