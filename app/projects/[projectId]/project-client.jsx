"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Columns3, Loader2, Plus, RefreshCcw, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { taskSortableId } from "@/components/kanban/task-card";
import { AppShell } from "@/components/layout/app-shell";
import { ErrorBanner } from "@/components/common/error-banner";
import { LoadingState } from "@/components/common/loading-state";
import { AddPeopleModal, canManageProjectTeam } from "@/components/projects/add-people-modal";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useProjectSocket } from "@/hooks/use-project-socket";
import { buildBoardColumns, newCustomLaneId } from "@/lib/board-columns";
import { formatApiError } from "@/lib/user-facing-error";
import { activitiesApi, commentsApi, projectsApi, tasksApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { useProjectStore } from "@/store/project-store";

function sortByPosition(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });
}

function nextPositionFor(tasks, status) {
  const last = sortByPosition(tasks.filter((task) => task.status === status)).at(-1);
  return last ? last.position + 1000 : 1000;
}

function positionBetween(previous, next) {
  if (previous && next) return (previous.position + next.position) / 2;
  if (previous) return previous.position + 1000;
  if (next) return next.position / 2;
  return 1000;
}

function taskIdKey(id) {
  if (id == null) return "";
  return typeof id === "string" ? id : id.toString();
}

function getProjectUsers(project) {
  const map = new Map();
  const add = (user) => {
    if (user?._id) map.set(user._id, user);
  };

  add(project?.owner);
  project?.members?.forEach((member) => add(member.user));
  return Array.from(map.values());
}

export default function ProjectClient({ projectId }) {
  const router = useRouter();
  const { isReady, user } = useAuthGuard();
  const authUser = useAuthStore((state) => state.user);
  const activeProject = useProjectStore((state) => state.activeProject);
  const tasks = useProjectStore((state) => state.tasks);
  const commentsByTask = useProjectStore((state) => state.commentsByTask);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const setTasks = useProjectStore((state) => state.setTasks);
  const upsertProject = useProjectStore((state) => state.upsertProject);
  const removeProject = useProjectStore((state) => state.removeProject);
  const upsertTask = useProjectStore((state) => state.upsertTask);
  const removeTask = useProjectStore((state) => state.removeTask);
  const replaceTaskId = useProjectStore((state) => state.replaceTaskId);
  const snapshotTasks = useProjectStore((state) => state.snapshotTasks);
  const restoreTasks = useProjectStore((state) => state.restoreTasks);
  const setComments = useProjectStore((state) => state.setComments);
  const addComment = useProjectStore((state) => state.addComment);
  const replaceCommentId = useProjectStore((state) => state.replaceCommentId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState("todo");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [addColumnTitle, setAddColumnTitle] = useState("");
  const [savingColumn, setSavingColumn] = useState(false);
  const [activitiesByTask, setActivitiesByTask] = useState({});
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const activityFetchSeq = useRef(0);
  const [peopleModalOpen, setPeopleModalOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  useProjectSocket(projectId);

  const projectUsers = useMemo(() => getProjectUsers(activeProject), [activeProject]);
  const boardColumns = useMemo(() => buildBoardColumns(activeProject), [activeProject]);
  const columnTitleMap = useMemo(() => Object.fromEntries(boardColumns.map((column) => [column.id, column.title])), [boardColumns]);
  const selectedComments = selectedTask ? commentsByTask[selectedTask._id] || [] : [];
  const selectedActivities = selectedTask ? activitiesByTask[taskIdKey(selectedTask._id)] || [] : [];
  const selectedIssueLabel = useMemo(() => {
    if (!selectedTask || !activeProject?.key || selectedTask.issueNumber == null) return null;
    return `${activeProject.key}-${selectedTask.issueNumber}`.toUpperCase();
  }, [activeProject?.key, selectedTask]);

  const refreshActivities = useCallback(async (taskId) => {
    const key = taskIdKey(taskId);
    if (!key) return;
    try {
      const { items } = await activitiesApi.list(key);
      setActivitiesByTask((prev) => ({ ...prev, [key]: items }));
    } catch {
      /* ignore — banner handled elsewhere when opening task */
    }
  }, []);

  const loadProject = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [{ project }, taskResult] = await Promise.all([projectsApi.get(projectId), tasksApi.list(projectId)]);
      setActiveProject(project);
      upsertProject(project);
      setTasks(taskResult.items);
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setLoading(false);
    }
  }, [projectId, setActiveProject, setTasks, upsertProject]);

  const reloadTasks = useCallback(async () => {
    const taskResult = await tasksApi.list(projectId);
    setTasks(taskResult.items);
  }, [projectId, setTasks]);

  useEffect(() => {
    if (!isReady || !user) return;
    loadProject();
  }, [isReady, loadProject, user]);

  const performTaskStatusMove = useCallback(
    async (activeTask, targetStatus, overTaskId) => {
      if (!activeTask || activeTask.isOptimistic) return;

      const activeTaskId = taskSortableId(activeTask);
      const targetTasks = sortByPosition(
        tasks.filter((task) => task.status === targetStatus && taskSortableId(task) !== activeTaskId)
      );
      let targetIndex = targetTasks.length;

      if (overTaskId) {
        const overId = String(overTaskId);
        const overIndex = targetTasks.findIndex((task) => taskSortableId(task) === overId);
        targetIndex = overIndex === -1 ? targetTasks.length : overIndex;
      }

      const previous = targetTasks[targetIndex - 1] || null;
      const next = targetTasks[targetIndex] || null;
      const position = positionBetween(previous, next);

      if (activeTask.status === targetStatus && Math.abs(activeTask.position - position) < 0.001) {
        return;
      }

      const snapshot = snapshotTasks();
      upsertTask({
        ...activeTask,
        status: targetStatus,
        position,
        version: activeTask.version + 1,
        isOptimistic: true
      });

      try {
        const { task } = await tasksApi.update(activeTask._id, {
          status: targetStatus,
          position,
          expectedVersion: activeTask.version
        });
        upsertTask(task);
        await refreshActivities(activeTask._id);
      } catch (apiError) {
        restoreTasks(snapshot);
        setError(formatApiError(apiError));
        if (apiError.status === 409) {
          await reloadTasks().catch(() => {});
        }
      }
    },
    [refreshActivities, reloadTasks, restoreTasks, snapshotTasks, tasks, upsertTask]
  );

  const moveTask = (event) => {
    const { active, over } = event;
    if (!over || String(active.id) === String(over.id)) return;

    const activeId = String(active.id);
    const activeTask = tasks.find((task) => taskSortableId(task) === activeId);
    if (!activeTask || activeTask.isOptimistic) return;

    const overType = over.data.current?.type;
    const targetStatus = overType === "column" ? over.data.current?.status : over.data.current?.task?.status;
    if (!targetStatus) return;

    const overTaskId = overType === "task" ? String(over.id) : null;
    void performTaskStatusMove(activeTask, targetStatus, overTaskId);
  };

  const moveTaskToColumn = (task, columnId) => {
    void performTaskStatusMove(task, columnId, null);
  };

  const openCreateTask = (status) => {
    setSelectedTask(null);
    setDefaultStatus(status ?? boardColumns[0]?.id ?? "todo");
    setDialogOpen(true);
  };

  const openTask = async (task) => {
    const seq = ++activityFetchSeq.current;
    setSelectedTask(task);
    setDefaultStatus(task.status);
    setDialogOpen(true);

    const key = taskIdKey(task._id);
    setActivitiesLoading(true);
    try {
      const [commentResult, activityResult] = await Promise.all([commentsApi.list(task._id), activitiesApi.list(task._id)]);
      if (seq !== activityFetchSeq.current) return;
      setComments(task._id, commentResult.items);
      setActivitiesByTask((prev) => ({ ...prev, [key]: activityResult.items }));
    } catch (apiError) {
      if (seq === activityFetchSeq.current) setError(formatApiError(apiError));
    } finally {
      if (seq === activityFetchSeq.current) setActivitiesLoading(false);
    }
  };

  const submitTask = async (values) => {
    setSaving(true);
    setError("");
    const snapshot = snapshotTasks();

    try {
      if (selectedTask) {
        const assignee = projectUsers.find((member) => member._id === values.assignee) || null;
        upsertTask({
          ...selectedTask,
          ...values,
          assignee,
          version: selectedTask.version + 1,
          isOptimistic: true
        });

        const { task } = await tasksApi.update(selectedTask._id, values);
        upsertTask(task);
        setSelectedTask(task);
        await refreshActivities(task._id);
        setDialogOpen(false);
      } else {
        const tempId = `temp-${crypto.randomUUID()}`;
        const assignee = projectUsers.find((member) => member._id === values.assignee) || null;
        const tempTask = {
          _id: tempId,
          ...values,
          project: projectId,
          assignee,
          reporter: authUser,
          position: nextPositionFor(tasks, values.status),
          version: 0,
          isOptimistic: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        upsertTask(tempTask);
        const payload = { ...values };
        delete payload.expectedVersion;
        const { task } = await tasksApi.create(projectId, payload);
        replaceTaskId(tempId, task);
        await refreshActivities(task._id);
        setDialogOpen(false);
      }
    } catch (apiError) {
      restoreTasks(snapshot);
      setError(formatApiError(apiError));
      if (apiError.status === 409) {
        await reloadTasks().catch(() => {});
      }
      throw apiError;
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async () => {
    if (!selectedTask) return;
    setDeleting(true);
    setError("");
    const snapshot = snapshotTasks();
    removeTask(selectedTask._id);
    try {
      await tasksApi.remove(selectedTask._id);
      setDialogOpen(false);
      setSelectedTask(null);
    } catch (apiError) {
      restoreTasks(snapshot);
      setError(formatApiError(apiError));
    } finally {
      setDeleting(false);
    }
  };

  const createComment = async (body) => {
    if (!selectedTask) return;
    setCommenting(true);
    setError("");

    const tempId = `temp-comment-${crypto.randomUUID()}`;
    const optimisticComment = {
      _id: tempId,
      task: selectedTask._id,
      project: projectId,
      author: authUser,
      body,
      isOptimistic: true,
      createdAt: new Date().toISOString()
    };

    addComment(optimisticComment);

    try {
      const { comment } = await commentsApi.create(selectedTask._id, { body });
      replaceCommentId(selectedTask._id, tempId, comment);
      await refreshActivities(selectedTask._id);
    } catch (apiError) {
      setComments(
        selectedTask._id,
        (commentsByTask[selectedTask._id] || []).filter((comment) => comment._id !== tempId)
      );
      setError(formatApiError(apiError));
      throw apiError;
    } finally {
      setCommenting(false);
    }
  };

  const confirmDeleteProject = async () => {
    if (!activeProject) return;
    setDeletingProject(true);
    setError("");
    try {
      await projectsApi.remove(activeProject._id);
      removeProject(activeProject._id);
      setDeleteProjectOpen(false);
      router.replace("/dashboard");
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setDeletingProject(false);
    }
  };

  const submitAddColumn = async () => {
    if (!activeProject) return;
    const title = addColumnTitle.trim();
    if (title.length < 2) {
      setError("Please enter a column name with at least 2 characters.");
      return;
    }
    const existing = activeProject.customLanes || [];
    if (existing.length >= 6) {
      setError("This project already has the maximum of six custom columns.");
      return;
    }

    setSavingColumn(true);
    setError("");
    try {
      const id = newCustomLaneId(title);
      const nextLanes = [...existing, { id, title: title.slice(0, 40) }];
      const { project } = await projectsApi.update(activeProject._id, { customLanes: nextLanes });
      setActiveProject(project);
      upsertProject(project);
      setAddColumnOpen(false);
      setAddColumnTitle("");
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setSavingColumn(false);
    }
  };

  if (!isReady || !user || loading) {
    return (
      <AppShell>
        <LoadingState label="Loading project" />
      </AppShell>
    );
  }

  if (!activeProject) {
    return (
      <AppShell>
        <ErrorBanner message={error || "Project could not be loaded."} />
      </AppShell>
    );
  }

  const firstColumnId = boardColumns[0]?.id ?? "todo";
  const canEditTeam = canManageProjectTeam(authUser, activeProject);

  return (
    <AppShell>
      <div className="flex min-h-0 min-w-0 max-w-full flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 sm:gap-4 lg:flex-row lg:items-start lg:gap-6">
          <div className="min-w-0">
            <Link className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Projects
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-3xl font-semibold tracking-tight">{activeProject.name}</h1>
              <Badge variant="outline" className="shrink-0 font-mono text-xs uppercase tracking-wide">
                {activeProject.key}
              </Badge>
              <Badge variant={activeProject.status === "active" ? "success" : "muted"}>{activeProject.status}</Badge>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {activeProject.description || "No project description has been added."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={loadProject}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button type="button" variant="destructive" onClick={() => setDeleteProjectOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={() => setAddColumnOpen(true)} title="Add a custom column">
              <Columns3 className="h-4 w-4" />
              Add column
            </Button>
            <Button type="button" variant="outline" onClick={() => setPeopleModalOpen(true)} title="View or manage project access">
              <UserPlus className="h-4 w-4" />
              {canEditTeam ? "Add people" : "People"}
            </Button>
            <Button type="button" onClick={() => openCreateTask(firstColumnId)}>
              <Plus className="h-4 w-4" />
              New task
            </Button>
          </div>
        </div>

        <ErrorBanner message={error} />

        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 p-4 text-sm text-muted-foreground">
            <span>{tasks.length} tasks</span>
            {boardColumns.map((column) => (
              <span key={column.id} className="inline-flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${column.tone}`} />
                {column.title}: {tasks.filter((task) => task.status === column.id).length}
              </span>
            ))}
          </CardContent>
        </Card>

        <KanbanBoard
          columns={boardColumns}
          projectKey={activeProject.key}
          tasks={tasks}
          onCreateTask={openCreateTask}
          onMoveTask={moveTask}
          onMoveTaskToColumn={moveTaskToColumn}
          onOpenTask={openTask}
        />

        <TaskDialog
          activities={selectedActivities}
          activitiesLoading={activitiesLoading}
          columnTitleMap={columnTitleMap}
          comments={selectedComments}
          currentUser={authUser}
          defaultStatus={defaultStatus}
          issueLabel={selectedIssueLabel}
          isCommenting={commenting}
          isDeleting={deleting}
          isOpen={dialogOpen}
          isSaving={saving}
          onCreateComment={createComment}
          onDelete={deleteTask}
          onOpenChange={setDialogOpen}
          onSubmit={submitTask}
          statusColumns={boardColumns}
          task={selectedTask}
          users={projectUsers}
        />

        <AddPeopleModal
          currentUser={authUser}
          open={peopleModalOpen}
          project={activeProject}
          onError={setError}
          onOpenChange={setPeopleModalOpen}
          onProjectUpdated={(project) => {
            setActiveProject(project);
            upsertProject(project);
          }}
        />

        <Dialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete project</DialogTitle>
              <DialogDescription>
                Delete <span className="font-medium text-foreground">{activeProject.name}</span>? This cannot be undone and removes
                all tasks in this project.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteProjectOpen(false)} disabled={deletingProject}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" disabled={deletingProject} onClick={() => void confirmDeleteProject()}>
                {deletingProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addColumnOpen} onOpenChange={setAddColumnOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add board column</DialogTitle>
              <DialogDescription>
                Adds a new column for this project only. You can have up to six custom columns in addition to the default
                four.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="new-column-title">Column name</Label>
              <Input
                id="new-column-title"
                placeholder="e.g. Blocked, QA, Backlog"
                value={addColumnTitle}
                onChange={(event) => setAddColumnTitle(event.target.value)}
                maxLength={40}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddColumnOpen(false)} disabled={savingColumn}>
                Cancel
              </Button>
              <Button type="button" disabled={savingColumn} onClick={() => void submitAddColumn()}>
                {savingColumn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add column
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
