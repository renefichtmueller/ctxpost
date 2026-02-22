export type Role = "ADMIN" | "EDITOR" | "REVIEWER" | "VIEWER";

export const PERMISSIONS = {
  ADMIN: {
    canManageTeam: true,
    canManageAccounts: true,
    canManageSettings: true,
    canCreatePosts: true,
    canEditPosts: true,
    canDeletePosts: true,
    canApproveRejectPosts: true,
    canSchedulePosts: true,
    canViewAnalytics: true,
    canUseAI: true,
    canManageLibrary: true,
  },
  EDITOR: {
    canManageTeam: false,
    canManageAccounts: false,
    canManageSettings: false,
    canCreatePosts: true,
    canEditPosts: true,
    canDeletePosts: false,
    canApproveRejectPosts: false,
    canSchedulePosts: true,
    canViewAnalytics: true,
    canUseAI: true,
    canManageLibrary: true,
  },
  REVIEWER: {
    canManageTeam: false,
    canManageAccounts: false,
    canManageSettings: false,
    canCreatePosts: false,
    canEditPosts: false,
    canDeletePosts: false,
    canApproveRejectPosts: true,
    canSchedulePosts: false,
    canViewAnalytics: true,
    canUseAI: false,
    canManageLibrary: false,
  },
  VIEWER: {
    canManageTeam: false,
    canManageAccounts: false,
    canManageSettings: false,
    canCreatePosts: false,
    canEditPosts: false,
    canDeletePosts: false,
    canApproveRejectPosts: false,
    canSchedulePosts: false,
    canViewAnalytics: true,
    canUseAI: false,
    canManageLibrary: false,
  },
} as const;

export type Permission = keyof typeof PERMISSIONS.ADMIN;

export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.[permission] ?? false;
}

/**
 * Returns all permissions for a given role.
 */
export function getPermissions(role: Role): (typeof PERMISSIONS)[Role] {
  return PERMISSIONS[role] ?? PERMISSIONS.VIEWER;
}

/**
 * Checks if a role can manage another role (for role assignment).
 * OWNER can assign any role except OWNER.
 * ADMIN can assign EDITOR, REVIEWER, VIEWER.
 * Others cannot assign roles.
 */
export function canAssignRole(assignerRole: string, targetRole: Role): boolean {
  if (assignerRole === "OWNER") {
    return targetRole !== "OWNER" as unknown as Role;
  }
  if (assignerRole === "ADMIN") {
    return targetRole === "EDITOR" || targetRole === "REVIEWER" || targetRole === "VIEWER";
  }
  return false;
}
