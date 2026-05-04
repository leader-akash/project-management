"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { TaskCardDragPreview, taskSortableId } from "@/components/kanban/task-card";

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });
}

function boardCollisionDetection(args) {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return closestCorners(args);
}

export function KanbanBoard({
  columns,
  projectKey,
  tasks,
  onCreateTask,
  onMoveTask,
  onOpenTask,
  onMoveTaskToColumn
}) {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const tasksByStatus = columns.reduce((acc, column) => {
    acc[column.id] = sortTasks(tasks.filter((task) => task.status === column.id));
    return acc;
  }, {});

  const handleDragStart = (event) => {
    const id = String(event.active.id);
    const task = tasks.find((t) => taskSortableId(t) === id) || null;
    setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    setActiveTask(null);
    onMoveTask(event);
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={boardCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-w-0 max-w-full rounded-lg border border-border/60 bg-muted/10 p-2 sm:p-3">
        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            columns={columns}
            projectKey={projectKey}
            tasks={tasksByStatus[column.id] || []}
            onCreateTask={onCreateTask}
            onMoveTaskToColumn={onMoveTaskToColumn}
            onOpenTask={onOpenTask}
          />
        ))}
        </div>
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.25, 1, 0.5, 1)" }}>
        {activeTask ? <TaskCardDragPreview task={activeTask} projectKey={projectKey} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
