"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { TaskCard, taskSortableId } from "@/components/kanban/task-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function KanbanColumn({ column, columns, tasks, onCreateTask, onOpenTask, onMoveTaskToColumn }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      status: column.id
    }
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[32rem] min-w-[18rem] flex-1 flex-col rounded-lg border bg-muted/35 transition",
        isOver && "border-primary/60 bg-primary/5 shadow-sm"
      )}
    >
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", column.tone)} />
          <h2 className="text-sm font-semibold">{column.title}</h2>
          <span className="rounded-md bg-background px-1.5 py-0.5 text-xs text-muted-foreground">{tasks.length}</span>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title={`Create ${column.title} task`} onClick={() => onCreateTask(column.id)}>
          <Plus className="h-4 w-4" />
          <span className="sr-only">Create task</span>
        </Button>
      </header>
      <SortableContext id={column.id} items={tasks.map((task) => taskSortableId(task))} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          {tasks.map((task) => (
            <TaskCard
              key={taskSortableId(task)}
              task={task}
              columns={columns}
              onMoveToColumn={onMoveTaskToColumn}
              onOpen={onOpenTask}
            />
          ))}
          {!tasks.length ? (
            <div className="flex min-h-28 items-center justify-center rounded-md border border-dashed bg-background/70 p-4 text-center text-xs text-muted-foreground">
              Drop tasks here
            </div>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}
