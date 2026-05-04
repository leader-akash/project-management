/** Workspace-level roles (MongoDB User.role). */
export function formatWorkspaceRole(role) {
  switch (role) {
    case "admin":
      return "Admin";
    case "manager":
      return "Project manager";
    case "member":
      return "Member";
    default:
      return role || "Member";
  }
}

export function canCreateWorkspaceProjects(user) {
  return user?.role === "admin" || user?.role === "manager";
}

export function isWorkspaceAdmin(user) {
  return user?.role === "admin";
}

/** Admin or workspace-level project manager (cross-project access). */
export function isWorkspaceLead(user) {
  return user?.role === "admin" || user?.role === "manager";
}
