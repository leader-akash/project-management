"use client";

import { create } from "zustand";

function byId(item) {
  const raw = item?._id ?? item?.id;
  if (raw == null) return undefined;
  return typeof raw === "string" ? raw : raw.toString?.() ?? String(raw);
}

/** Accepts a task object or a raw id string (e.g. temp-… from optimistic creates). */
function normalizeTaskId(value) {
  if (value == null) return undefined;
  if (typeof value === "string" || typeof value === "number") return String(value);
  return byId(value);
}

function dedupeTasksById(tasks) {
  const seen = new Set();
  const result = [];
  for (const item of tasks) {
    const id = byId(item);
    if (id == null) {
      result.push(item);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(item);
  }
  return result;
}

export const useProjectStore = create((set, get) => ({
  projects: [],
  activeProject: null,
  tasks: [],
  commentsByTask: {},
  isLoading: false,
  error: null,

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ activeProject: project }),
  setTasks: (tasks) =>
    set({
      tasks: dedupeTasksById((tasks || []).map((item) => ({ ...item, isOptimistic: false })))
    }),

  upsertProject: (project) =>
    set((state) => {
      const exists = state.projects.some((item) => byId(item) === byId(project));
      return {
        projects: exists
          ? state.projects.map((item) => (byId(item) === byId(project) ? project : item))
          : [project, ...state.projects],
        activeProject: byId(state.activeProject) === byId(project) ? project : state.activeProject
      };
    }),

  removeProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((project) => byId(project) !== projectId),
      activeProject: byId(state.activeProject) === projectId ? null : state.activeProject
    })),

  upsertTask: (task) =>
    set((state) => {
      const taskId = byId(task);
      const existing = state.tasks.find((item) => byId(item) === taskId);
      if (existing && !task.isOptimistic && existing.version > task.version) {
        return state;
      }

      const next = existing
        ? state.tasks.map((item) => {
            if (byId(item) !== taskId) return item;
            const merged = { ...item, ...task };
            if (task.isOptimistic !== true) merged.isOptimistic = false;
            return merged;
          })
        : [...state.tasks, { ...task, isOptimistic: task.isOptimistic === true }];

      return {
        tasks: dedupeTasksById(next)
      };
    }),

  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => byId(task) !== taskId)
    })),

  replaceTaskId: (tempId, task) =>
    set((state) => {
      const tid = normalizeTaskId(tempId);
      const mapped = state.tasks.map((item) => (byId(item) === tid ? { ...task, isOptimistic: false } : item));
      return { tasks: dedupeTasksById(mapped) };
    }),

  snapshotTasks: () => get().tasks,
  restoreTasks: (tasks) => set({ tasks }),

  setComments: (taskId, comments) =>
    set((state) => ({
      commentsByTask: {
        ...state.commentsByTask,
        [taskId]: comments
      }
    })),

  addComment: (comment) =>
    set((state) => {
      const taskId = comment.task?.toString?.() || comment.task;
      const current = state.commentsByTask[taskId] || [];
      if (current.some((entry) => byId(entry) === byId(comment))) {
        return state;
      }

      return {
        commentsByTask: {
          ...state.commentsByTask,
          [taskId]: [...current, comment]
        }
      };
    }),

  replaceCommentId: (taskId, tempId, comment) =>
    set((state) => {
      const seen = new Set();
      const comments = (state.commentsByTask[taskId] || [])
        .map((entry) => (byId(entry) === tempId ? comment : entry))
        .filter((entry) => {
          const id = byId(entry);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });

      return {
        commentsByTask: {
          ...state.commentsByTask,
          [taskId]: comments
        }
      };
    })
}));
