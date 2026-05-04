"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ErrorBanner } from "@/components/common/error-banner";
import { LoadingState } from "@/components/common/loading-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { formatWorkspaceRole, isWorkspaceAdmin } from "@/lib/workspace";
import { adminApi } from "@/services/api";

export default function AdminPage() {
  const router = useRouter();
  const { isReady, user } = useAuthGuard();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady || !user) return;
    if (!isWorkspaceAdmin(user)) {
      router.replace("/dashboard");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    adminApi
      .overview()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, router, user]);

  if (!isReady || !user) {
    return <LoadingState label="Loading" />;
  }

  if (!isWorkspaceAdmin(user)) {
    return <LoadingState label="Redirecting" />;
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <p className="text-sm font-medium text-primary">Workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Overview of all users and projects. Only workspace admins see this page.
          </p>
        </div>

        <ErrorBanner message={error} />

        {loading ? (
          <LoadingState label="Loading admin data" />
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Users</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">{data.stats.users}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Projects</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">{data.stats.projects}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Tasks</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">{data.stats.tasks}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Workspace accounts and roles.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 pr-4 font-medium">Email</th>
                      <th className="py-2 pr-4 font-medium">Role</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((u) => (
                      <tr key={u._id} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-4 font-medium">{u.name}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{u.email}</td>
                        <td className="py-2 pr-4">
                          <Badge variant="outline">{formatWorkspaceRole(u.role)}</Badge>
                        </td>
                        <td className="py-2">
                          <Badge variant={u.isActive ? "secondary" : "destructive"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
                <CardDescription>All projects in the workspace.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 pr-4 font-medium">Key</th>
                      <th className="py-2 pr-4 font-medium">Owner</th>
                      <th className="py-2 font-medium">Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.projects.map((p) => (
                      <tr key={p._id} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-4">
                          <Link className="font-medium text-primary hover:underline" href={`/projects/${p._id}`}>
                            {p.name}
                          </Link>
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{p.key}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{p.owner?.name ?? "—"}</td>
                        <td className="py-2 tabular-nums text-muted-foreground">{p.members?.length ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
