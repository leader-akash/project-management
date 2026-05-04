"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ActivityPanel } from "@/components/tasks/activity-panel";
import { CommentPanel } from "@/components/tasks/comment-panel";
import { Button } from "@/components/ui/button";
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITIES, TASK_COLUMNS } from "@/lib/constants";
import { toDateInputValue } from "@/lib/utils";

function buildTaskSchema(columnIds) {
  const allowed = new Set(columnIds);
  return z
    .object({
      title: z.string().min(2, "Title must be at least 2 characters.").max(160),
      description: z.string().max(5000).optional(),
      status: z.string().min(2).max(40),
      priority: z.enum(["low", "medium", "high", "urgent"]),
      assignee: z.string().optional(),
      dueDate: z.string().optional()
    })
    .superRefine((data, ctx) => {
      if (!allowed.has(data.status)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pick a column that exists on this board.",
          path: ["status"]
        });
      }
    });
}

export function TaskDialog({
  activities = [],
  activitiesLoading = false,
  columnTitleMap = {},
  comments,
  defaultStatus,
  issueLabel,
  isCommenting,
  isDeleting,
  isOpen,
  isSaving,
  onCreateComment,
  onDelete,
  onOpenChange,
  onSubmit,
  statusColumns = TASK_COLUMNS,
  task,
  users
}) {
  const columnIds = useMemo(() => statusColumns.map((column) => column.id), [statusColumns]);
  const columnKey = columnIds.join("|");
  const schema = useMemo(() => buildTaskSchema(columnIds), [columnKey]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      status: defaultStatus || columnIds[0] || "todo",
      priority: "medium",
      assignee: "",
      dueDate: ""
    }
  });

  useEffect(() => {
    if (!isOpen) return;
    const fallbackStatus = task?.status || defaultStatus || columnIds[0] || "todo";
    const status = columnIds.includes(fallbackStatus) ? fallbackStatus : columnIds[0] || "todo";
    form.reset({
      title: task?.title || "",
      description: task?.description || "",
      status,
      priority: task?.priority || "medium",
      assignee: task?.assignee?._id || "",
      dueDate: toDateInputValue(task?.dueDate)
    });
  }, [columnKey, defaultStatus, form, isOpen, task]);

  const submit = async (values) => {
    try {
      await onSubmit({
        ...values,
        assignee: values.assignee || null,
        dueDate: values.dueDate || null,
        expectedVersion: task?.version
      });
    } catch (_error) {
      // The project page renders the request error and keeps the dialog open.
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {issueLabel ? (
              <span className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-tight text-muted-foreground">
                {issueLabel}
              </span>
            ) : null}
            <span>{task ? "Edit task" : "Create task"}</span>
          </DialogTitle>
          <DialogDescription>
            {task ? "Changes are guarded by task version checks to prevent silent overwrites." : "New tasks are synced to every active board member."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={form.handleSubmit(submit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" {...form.register("title")} />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea id="task-description" rows={4} {...form.register("description")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-status">Column</Label>
              <Select id="task-status" {...form.register("status")}>
                {statusColumns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </Select>
              {form.formState.errors.status && <p className="text-xs text-destructive">{form.formState.errors.status.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select id="task-priority" {...form.register("priority")}>
                {PRIORITIES.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <Select id="task-assignee" {...form.register("assignee")}>
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input id="task-due" type="date" {...form.register("dueDate")} />
            </div>
          </div>

          <DialogFooter>
            {task ? (
              <Button type="button" variant="destructive" disabled={isDeleting} onClick={onDelete}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </Button>
            ) : null}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </form>

        {task ? (
          <>
            <ActivityPanel activities={activities} columnTitleMap={columnTitleMap} className="mb-4" isLoading={activitiesLoading} />
            <CommentPanel comments={comments} onCreateComment={onCreateComment} isSubmitting={isCommenting} />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
