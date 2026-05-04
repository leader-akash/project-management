"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatApiError } from "@/lib/user-facing-error";
import { projectsApi, usersApi } from "@/services/api";
import { cn } from "@/lib/utils";

function userId(u) {
  if (!u) return "";
  return typeof u === "string" ? u : u._id?.toString?.() || u.toString?.() || "";
}

function canManageTeam(currentUser, project) {
  if (!currentUser || !project?.owner) return false;
  const ownerId = userId(project.owner);
  if (ownerId && ownerId === userId(currentUser)) return true;
  const me = project.members?.find((m) => userId(m.user) === userId(currentUser));
  return me?.role === "manager";
}

function membersToPayload(project) {
  return (project.members || []).map((m) => ({
    user: userId(m.user),
    role: m.role
  }));
}

export function ProjectTeamPanel({ currentUser, onError, onProjectUpdated, project }) {
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [addRole, setAddRole] = useState("member");

  const manage = canManageTeam(currentUser, project);

  useEffect(() => {
    if (!manage || search.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await usersApi.list(search.trim());
        if (cancelled) return;
        const existing = new Set();
        const oid = userId(project?.owner);
        if (oid) existing.add(oid);
        project?.members?.forEach((m) => existing.add(userId(m.user)));
        setResults(users.filter((u) => !existing.has(userId(u))));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [manage, project, search]);

  const pushProject = useCallback(
    async (membersPayload) => {
      if (!project?._id) return;
      setSaving(true);
      try {
        const { project: next } = await projectsApi.update(project._id, { members: membersPayload });
        onProjectUpdated(next);
        setSearch("");
        setResults([]);
      } catch (error) {
        onError(formatApiError(error));
      } finally {
        setSaving(false);
      }
    },
    [onError, onProjectUpdated, project?._id]
  );

  const addMember = async (userToAdd) => {
    const id = userId(userToAdd);
    if (!id) return;
    const next = [...membersToPayload(project), { user: id, role: addRole }];
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

  const ownerId = userId(project?.owner);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">People</CardTitle>
        <CardDescription>Who can see this project, assign work, and comment — similar to Jira project access.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {manage ? (
          <div className="space-y-2">
            <Label htmlFor="team-search">Add people by name or email</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Input
                id="team-search"
                placeholder="Search workspace users…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                autoComplete="off"
              />
              <div className="flex shrink-0 items-center gap-2">
                <Label htmlFor="add-role" className="sr-only">
                  Default role
                </Label>
                <Select id="add-role" className="min-w-[8rem]" value={addRole} onChange={(e) => setAddRole(e.target.value)}>
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </div>
            </div>
            {searching ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching…
              </p>
            ) : null}
            {results.length > 0 ? (
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border bg-muted/30 p-1">
                {results.map((u) => (
                  <li key={userId(u)} className="flex items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-background/80">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar name={u.name} className="h-7 w-7 text-[10px]" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => void addMember(u)}>
                      <UserPlus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
            {manage && search.trim().length >= 2 && !searching && results.length === 0 ? (
              <p className="text-xs text-muted-foreground">No matching users, or everyone listed is already on the project.</p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Project lead</p>
          <div className="flex items-center justify-between gap-2 rounded-lg border bg-background/60 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar name={project?.owner?.name} className="h-8 w-8 text-[10px]" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{project?.owner?.name || "Owner"}</p>
                <p className="truncate text-xs text-muted-foreground">{project?.owner?.email}</p>
              </div>
            </div>
            <Badge variant="secondary">Owner</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Members</p>
          {!project?.members?.length ? (
            <p className="text-sm text-muted-foreground">No additional members yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {project.members.map((entry) => {
                const uid = userId(entry.user);
                const isSelf = uid === userId(currentUser);
                return (
                  <li key={uid} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar name={entry.user?.name} className="h-8 w-8 text-[10px]" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{entry.user?.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{entry.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {manage && entry.role !== "owner" ? (
                        <Select
                          className={cn("h-8 min-w-[7.5rem] text-sm")}
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
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
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

        {!manage ? (
          <p className="text-xs text-muted-foreground">Only the project owner or a project manager can add or remove people.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
