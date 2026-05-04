"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ErrorBanner } from "@/components/common/error-banner";
import { LoadingState } from "@/components/common/loading-state";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectCreateModal } from "@/components/projects/project-create-modal";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { projectsApi } from "@/services/api";
import { canCreateWorkspaceProjects } from "@/lib/workspace";
import { useProjectStore } from "@/store/project-store";

export default function DashboardPage() {
  const { isReady, user } = useAuthGuard();
  const projects = useProjectStore((state) => state.projects);
  const setProjects = useProjectStore((state) => state.setProjects);
  const upsertProject = useProjectStore((state) => state.upsertProject);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!isReady || !user) return;

    let mounted = true;
    setLoading(true);
    projectsApi
      .list()
      .then((result) => {
        if (mounted) setProjects(result.items);
      })
      .catch((apiError) => {
        if (mounted) setError(apiError.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isReady, setProjects, user]);

  const filteredProjects = projects.filter((project) => {
    const value = `${project.name} ${project.key} ${project.description}`.toLowerCase();
    return value.includes(search.toLowerCase());
  });

  const createProject = async (values) => {
    setCreating(true);
    setError("");
    try {
      const { project } = await projectsApi.create({
        name: values.name,
        ...(values.description ? { description: values.description } : {})
      });
      upsertProject(project);
    } catch (apiError) {
      setError(apiError.message);
      throw apiError;
    } finally {
      setCreating(false);
    }
  };

  if (!isReady || !user) {
    return <LoadingState label="Preparing workspace" />;
  }

  const allowCreateProject = canCreateWorkspaceProjects(user);
  const hasAnyProjects = projects.length > 0;
  const showFilteredEmpty = hasAnyProjects && filteredProjects.length === 0;
  const showTrueEmpty = !hasAnyProjects;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-primary">Workspace</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Open a project for the real-time board. Keys are generated automatically for each project.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:min-w-[280px]">
            {allowCreateProject ? (
              <Button type="button" className="w-full shrink-0 sm:w-auto" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add project
              </Button>
            ) : null}
            <div className="relative w-full flex-1 sm:min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search projects" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </div>
        </div>

        <ErrorBanner message={error} />

        {!allowCreateProject ? (
          <Card>
            <CardHeader>
              <CardTitle>Your access</CardTitle>
              <CardDescription>
                You can work on projects you are added to. Ask a workspace admin or project manager to create a project and add you.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">All projects</h2>

          {loading ? (
            <LoadingState label="Loading projects" />
          ) : filteredProjects.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          ) : showFilteredEmpty ? (
            <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed bg-card/60 p-8 text-center">
              <div>
                <h3 className="font-semibold">No matching projects</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">Try a different search term.</p>
              </div>
            </div>
          ) : showTrueEmpty ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-card/60 p-10 text-center">
              <div>
                <h3 className="font-semibold">No projects yet</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {allowCreateProject ? "Create the first project for your workspace." : "Projects will appear here once you are added to one."}
                </p>
              </div>
              {allowCreateProject ? (
                <Button type="button" size="lg" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add project
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {allowCreateProject ? (
        <ProjectCreateModal open={createOpen} onOpenChange={setCreateOpen} onCreate={createProject} isSubmitting={creating} />
      ) : null}
    </AppShell>
  );
}
