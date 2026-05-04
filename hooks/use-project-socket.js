"use client";

import { useEffect } from "react";
import { getSocket, joinProject, leaveProject, onSocketEvent } from "@/services/socket";
import { useProjectStore } from "@/store/project-store";

export function useProjectSocket(projectId) {
  const upsertTask = useProjectStore((state) => state.upsertTask);
  const removeTask = useProjectStore((state) => state.removeTask);
  const upsertProject = useProjectStore((state) => state.upsertProject);
  const removeProject = useProjectStore((state) => state.removeProject);
  const addComment = useProjectStore((state) => state.addComment);

  useEffect(() => {
    if (!projectId || !getSocket()) return;

    joinProject(projectId);
    const cleanup = [
      onSocketEvent("task:created", ({ task }) => upsertTask(task)),
      onSocketEvent("task:updated", ({ task }) => upsertTask(task)),
      onSocketEvent("task:deleted", ({ taskId }) => removeTask(taskId?.toString?.() || taskId)),
      onSocketEvent("project:updated", ({ project }) => upsertProject(project)),
      onSocketEvent("project:deleted", ({ projectId: deletedProjectId }) =>
        removeProject(deletedProjectId?.toString?.() || deletedProjectId)
      ),
      onSocketEvent("comment:created", ({ comment }) => addComment(comment))
    ];

    return () => {
      leaveProject(projectId);
      cleanup.forEach((fn) => fn());
    };
  }, [addComment, projectId, removeProject, removeTask, upsertProject, upsertTask]);
}

