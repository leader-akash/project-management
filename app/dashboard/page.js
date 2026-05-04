"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ErrorBanner } from "@/components/common/error-banner";
import { LoadingState } from "@/components/common/loading-state";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectForm } from "@/components/projects/project-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { projectsApi } from "@/services/api";
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
      const { project } = await projectsApi.create(values);
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

  return (
    <AppShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-primary">Workspace</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Create internal projects, coordinate ownership, and open a real-time task board for execution.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search projects" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </div>

        <ErrorBanner message={error} />

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>New project</CardTitle>
              <CardDescription>Project owners can manage settings, members, and tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectForm onSubmit={createProject} isSubmitting={creating} />
            </CardContent>
          </Card>

          <section>
            {loading ? (
              <LoadingState label="Loading projects" />
            ) : filteredProjects.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed bg-card/60 p-8 text-center">
                <div>
                  <h2 className="font-semibold">No projects found</h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Create a project or adjust your search to find an existing workspace.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

