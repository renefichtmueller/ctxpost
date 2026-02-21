import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyTeams } from "@/actions/teams";
import { TeamManager } from "@/components/team/team-manager";

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
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <TeamManager initialTeams={teams} currentUserId={session.user.id} />
    </div>
  );
}
