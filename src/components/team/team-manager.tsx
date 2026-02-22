"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, UserPlus, Trash2, Shield, Users } from "lucide-react";
import { createTeam, inviteMember, removeMember, updateMemberRole } from "@/actions/teams";
import type { TeamRole } from "@prisma/client";
import { toast } from "sonner";

type TeamMember = {
  id: string;
  userId: string;
  role: TeamRole;
  joinedAt: string | Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

type Team = {
  id: string;
  name: string;
  slug: string;
  createdAt: string | Date;
  members: TeamMember[];
  myRole: TeamRole;
};

interface TeamManagerProps {
  initialTeams: Team[];
  currentUserId: string;
}

const ROLE_COLORS: Record<TeamRole, string> = {
  OWNER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  EDITOR: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  REVIEWER: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  VIEWER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

/** Assignable roles (excludes OWNER) */
const ASSIGNABLE_ROLES: TeamRole[] = ["ADMIN", "EDITOR", "REVIEWER", "VIEWER"];

export function TeamManager({ initialTeams, currentUserId }: TeamManagerProps) {
  const t = useTranslations("team");
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [teamName, setTeamName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreateTeam = () => {
    if (!teamName.trim()) return;

    startTransition(async () => {
      const result = await createTeam(teamName);
      if ("error" in result) {
        toast.error(result.error);
      } else if (result.team) {
        setTeams((prev) => [
          {
            ...result.team,
            myRole: "OWNER" as TeamRole,
          },
          ...prev,
        ]);
        setTeamName("");
        toast.success(t("title"));
      }
    });
  };

  const handleRemoveMember = (teamId: string, userId: string) => {
    startTransition(async () => {
      const result = await removeMember(teamId, userId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setTeams((prev) =>
          prev.map((team) =>
            team.id === teamId
              ? {
                  ...team,
                  members: team.members.filter((m) => m.userId !== userId),
                }
              : team
          )
        );
      }
    });
  };

  const handleRoleChange = (
    teamId: string,
    userId: string,
    newRole: TeamRole
  ) => {
    startTransition(async () => {
      const result = await updateMemberRole(teamId, userId, newRole);
      if ("error" in result) {
        toast.error(result.error);
      } else if (result.member) {
        setTeams((prev) =>
          prev.map((team) =>
            team.id === teamId
              ? {
                  ...team,
                  members: team.members.map((m) =>
                    m.userId === userId ? { ...m, role: newRole } : m
                  ),
                }
              : team
          )
        );
        toast.success(t("roleUpdated"));
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Create Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("createTeam")}
          </CardTitle>
          <CardDescription>{t("createTeamDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder={t("teamName")}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
              disabled={isPending}
            />
            <Button onClick={handleCreateTeam} disabled={isPending || !teamName.trim()}>
              {t("createTeam")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team List */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">{t("noTeams")}</h3>
            <p className="text-muted-foreground mt-1">{t("noTeamsDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            currentUserId={currentUserId}
            isPending={isPending}
            onRemoveMember={handleRemoveMember}
            onRoleChange={handleRoleChange}
          />
        ))
      )}
    </div>
  );
}

function TeamCard({
  team,
  currentUserId,
  isPending,
  onRemoveMember,
  onRoleChange,
}: {
  team: Team;
  currentUserId: string;
  isPending: boolean;
  onRemoveMember: (teamId: string, userId: string) => void;
  onRoleChange: (teamId: string, userId: string, role: TeamRole) => void;
}) {
  const t = useTranslations("team");
  const canManageMembers = team.myRole === "OWNER" || team.myRole === "ADMIN";
  const isOwner = team.myRole === "OWNER";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {team.name}
            </CardTitle>
            <CardDescription>
              {t("members")}: {team.members.length}
            </CardDescription>
          </div>
          {canManageMembers && (
            <InviteMemberDialog teamId={team.id} isPending={isPending} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {team.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {(member.user.name || member.user.email)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {member.user.name || member.user.email}
                    </span>
                    {member.userId === currentUserId && (
                      <Badge variant="outline" className="text-xs">
                        {t("you")}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {member.user.email}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isOwner && member.userId !== currentUserId && member.role !== "OWNER" ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) =>
                      onRoleChange(team.id, member.userId, value as TeamRole)
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          <span className="flex items-center gap-2">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                role === "ADMIN"
                                  ? "bg-purple-500"
                                  : role === "EDITOR"
                                  ? "bg-blue-500"
                                  : role === "REVIEWER"
                                  ? "bg-orange-500"
                                  : "bg-gray-500"
                              }`}
                            />
                            {t(`roles.${role.toLowerCase()}`)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className={`cursor-default ${ROLE_COLORS[member.role]}`}
                        >
                          {t(`roles.${member.role.toLowerCase()}`)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>{t(`roleDesc.${member.role.toLowerCase()}`)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {canManageMembers &&
                  member.userId !== currentUserId &&
                  member.role !== "OWNER" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onRemoveMember(team.id, member.userId)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InviteMemberDialog({
  teamId,
  isPending: parentPending,
}: {
  teamId: string;
  isPending: boolean;
}) {
  const t = useTranslations("team");
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("VIEWER");
  const [isPending, startTransition] = useTransition();

  const handleInvite = () => {
    if (!email.trim()) return;

    startTransition(async () => {
      const result = await inviteMember(teamId, email, role);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(t("inviteMember"));
        setEmail("");
        setRole("VIEWER");
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={parentPending}>
          <UserPlus className="h-4 w-4 mr-2" />
          {t("inviteMember")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("inviteMember")}</DialogTitle>
          <DialogDescription>{t("inviteDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Input
              type="email"
              placeholder={t("emailAddress")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as TeamRole)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectRole")} />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    <div className="flex flex-col">
                      <span className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            r === "ADMIN"
                              ? "bg-purple-500"
                              : r === "EDITOR"
                              ? "bg-blue-500"
                              : r === "REVIEWER"
                              ? "bg-orange-500"
                              : "bg-gray-500"
                          }`}
                        />
                        {t(`roles.${r.toLowerCase()}`)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t(`roleDesc.${r.toLowerCase()}`)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleInvite}
            disabled={isPending || !email.trim()}
            className="w-full"
          >
            {t("invite")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
