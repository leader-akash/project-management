"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatApiError } from "@/lib/user-facing-error";
import { projectsApi, usersApi } from "@/services/api";
import { cn } from "@/lib/utils";

export function userId(u) {
  if (!u) return "";
  return typeof u === "string" ? u : u._id?.toString?.() || u.toString?.() || "";
}

export function canManageProjectTeam(currentUser, project) {
  if (!currentUser || !project?.owner) return false;
  const ownerId = userId(project.owner);
  if (ownerId && ownerId === userId(currentUser)) return true;
  const me = project.members?.find((m) => userId(m.user) === userId(currentUser));
  return me?.role === "manager";
}

/** Members payload for PATCH (excludes owner; dedupes by user id). */
function membersToPayload(project) {
  const ownerId = userId(project?.owner);
  const seen = new Set();
  const out = [];
  for (const m of project.members || []) {
    const id = userId(m.user);
    if (!id || id === ownerId || seen.has(id)) continue;
    seen.add(id);
    out.push({ user: id, role: m.role });
  }
  return out;
}

function dedupedMembersForDisplay(project) {
  const ownerId = userId(project?.owner);
  const seen = new Set();
  const out = [];
  for (const m of project.members || []) {
    const id = userId(m.user);
    if (!id || id === ownerId || seen.has(id)) continue;
    seen.add(id);
    out.push(m);
  }
  return out;
}

export function AddPeopleModal({ currentUser, onError, onOpenChange, onProjectUpdated, open, project }) {
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [defaultAddRole, setDefaultAddRole] = useState("member");

  const manage = canManageProjectTeam(currentUser, project);
  const ownerId = userId(project?.owner);
  const onProject = Boolean(project?._id);

  const memberRows = useMemo(() => dedupedMembersForDisplay(project), [project]);

  const onProjectIds = useMemo(() => {
    const set = new Set();
    if (ownerId) set.add(ownerId);
    memberRows.forEach((m) => set.add(userId(m.user)));
    return set;
  }, [memberRows, ownerId]);

  const filteredWorkspace = useMemo(() => {
    const q = filter.trim().toLowerCase();
    let list = workspaceUsers;
    if (q) {
      list = list.filter((u) => {
        const hay = `${u.name || ""} ${u.email || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [filter, workspaceUsers]);

  useEffect(() => {
    if (!open) return;
    if (!manage) {
      setWorkspaceUsers([]);
      setLoadingUsers(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      try {
        const { items } = await usersApi.list({ limit: 500 });
        if (!cancelled) setWorkspaceUsers(Array.isArray(items) ? items : []);
      } catch (error) {
        if (!cancelled) {
          setWorkspaceUsers([]);
          onError(formatApiError(error));
        }
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [manage, onError, open]);

  useEffect(() => {
    if (!open) {
      setFilter("");
      setWorkspaceUsers([]);
    }
  }, [open]);

  const pushProject = useCallback(
    async (membersPayload) => {
      if (!project?._id) return;
      setSaving(true);
      try {
        const { project: next } = await projectsApi.update(project._id, { members: membersPayload });
        onProjectUpdated(next);
      } catch (error) {
        onError(formatApiError(error));
      } finally {
        setSaving(false);
      }
    },
    [onError, onProjectUpdated, project?._id]
  );

  const addMember = async (userToAdd, role = defaultAddRole) => {
    const id = userId(userToAdd);
    if (!id || onProjectIds.has(id)) return;
    const next = [...membersToPayload(project), { user: id, role }];
    await pushProject(next);
  };

  const removeMember = async (memberUserId) => {
    const id = userId(memberUserId);
    const next = membersToPayload(project).filter((m) => m.user !== id);
    await pushProject(next);
  };

  const changeMemberRole = async (memberUserId, role) => {
    const id = userId(memberUserId);
    const next = membersToPayload(project).map((m) => (m.user === id ? { ...m, role } : m));
    await pushProject(next);
  };

  return (
    <Dialog open={open && onProject} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle>People on this project</DialogTitle>
            <DialogDescription>
              {manage
                ? "Everyone in the workspace is listed below. Add people to this project or change their project role. Owner is always full access."
                : "Project lead and members with their roles on this project."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[calc(min(90vh,720px)-8rem)] overflow-y-auto px-6 py-4">
          {!manage ? (
            <p className="text-sm text-muted-foreground">
              Only the project owner or a project manager can change who is on this project.
            </p>
          ) : null}

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project lead</p>
              <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar name={project?.owner?.name} className="h-9 w-9 text-[10px]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{project?.owner?.name || "Owner"}</p>
                    <p className="truncate text-xs text-muted-foreground">{project?.owner?.email}</p>
                  </div>
                </div>
                <Badge variant="secondary">Owner</Badge>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Members</p>
              {!memberRows.length ? (
                <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  {manage
                    ? "No members yet. Add people from the workspace list below."
                    : "No members on this project besides the owner."}
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {memberRows.map((entry) => {
                    const uid = userId(entry.user);
                    const isSelf = uid === userId(currentUser);
                    return (
                      <li key={uid} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar name={entry.user?.name} className="h-9 w-9 text-[10px]" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{entry.user?.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{entry.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {manage ? (
                            <Select
                              className={cn("h-9 min-w-[7.5rem] text-sm")}
                              value={entry.role}
                              onChange={(e) => void changeMemberRole(entry.user, e.target.value)}
                              disabled={saving}
                            >
                              <option value="member">Member</option>
                              <option value="manager">Manager</option>
                              <option value="viewer">Viewer</option>
                            </Select>
                          ) : (
                            <Badge variant="outline">{entry.role}</Badge>
                          )}
                          {manage && !isSelf && uid !== ownerId ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                              title="Remove from project"
                              disabled={saving}
                              onClick={() => void removeMember(entry.user)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {manage ? (
              <div className="space-y-3 border-t pt-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workspace users</Label>
                    <p className="mt-1 text-xs text-muted-foreground">All active users from the database. Filter by name or email.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="default-role" className="sr-only">
                      Role when adding
                    </Label>
                    <Select
                      id="default-role"
                      className="h-9 min-w-[8rem]"
                      value={defaultAddRole}
                      onChange={(e) => setDefaultAddRole(e.target.value)}
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="viewer">Viewer</option>
                    </Select>
                  </div>
                </div>
                <Input placeholder="Filter by name or email…" value={filter} onChange={(e) => setFilter(e.target.value)} />
                {loadingUsers ? (
                  <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading users…
                  </p>
                ) : (
                  <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border bg-muted/20 p-1">
                    {filteredWorkspace.map((u) => {
                      const uid = userId(u);
                      const already = onProjectIds.has(uid);
                      return (
                        <li
                          key={uid}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-background/90"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar name={u.name} className="h-8 w-8 text-[10px]" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{u.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                          {already ? (
                            <Badge variant="outline" className="shrink-0">
                              On project
                            </Badge>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={saving}
                              onClick={() => void addMember(u, defaultAddRole)}
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Add
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!loadingUsers && filteredWorkspace.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No users match this filter.</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end border-t bg-muted/20 px-6 py-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
