"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, MessageSquare, MoreVertical } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { dueLabel } from "@/utils/date";

const MENU_WIDTH = 176;

const priorityTone = {
  low: "muted",
  medium: "secondary",
  high: "warning",
  urgent: "destructive"
};

export function taskSortableId(task) {
  const raw = task?._id ?? task?.id;
  if (raw == null) return "";
  return typeof raw === "string" ? raw : raw.toString?.() ?? String(raw);
}

export function TaskCardFace({ task, className, dimmed }) {
  const reporterName = task.reporter?.name;

  return (
    <div className={cn("relative min-w-0 pr-9", className)}>
      <p className="line-clamp-2 text-sm font-medium">{task.title}</p>
      {reporterName ? (
        <p className="mt-1 text-[11px] text-muted-foreground">
          Created by <span className="font-medium text-foreground/90">{reporterName}</span>
        </p>
      ) : null}
      {task.description ? (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={priorityTone[task.priority] || "secondary"}>{task.priority}</Badge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          {dueLabel(task.dueDate)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {task.assignee ? (
          <div className="inline-flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <Avatar name={task.assignee.name} className="h-6 w-6 shrink-0 text-[10px]" />
            <span className="truncate">{task.assignee.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          {task.isOptimistic ? "Saving…" : `v${task.version}`}
        </span>
      </div>

      {dimmed ? <div className="pointer-events-none absolute inset-0 rounded-lg bg-background/40" aria-hidden /> : null}
    </div>
  );
}

export function TaskCardDragPreview({ task }) {
  return (
    <div
      className={cn(
        "w-[min(100vw-2rem,18rem)] cursor-grabbing rounded-lg border bg-card p-3 text-left shadow-lg ring-2 ring-primary/25"
      )}
    >
      <TaskCardFace task={task} className="pr-0" />
    </div>
  );
}

function TaskColumnMenu({ task, columns, onMoveToColumn }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const destinations = columns.filter((column) => column.id !== task.status);

  const updatePosition = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let left = rect.right - MENU_WIDTH;
    left = Math.min(Math.max(8, left), window.innerWidth - MENU_WIDTH - 8);
    let top = rect.bottom + 6;
    top = Math.min(top, window.innerHeight - 8);
    top = Math.max(8, top);
    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => updatePosition();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (btnRef.current?.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: MENU_WIDTH,
              zIndex: 10000
            }}
            className="rounded-lg border border-border bg-card py-1 text-card-foreground shadow-xl outline-none ring-1 ring-black/5 dark:ring-white/10"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Move to</div>
            <div className="border-t border-border/60" />
            {destinations.map((column) => (
              <button
                key={column.id}
                type="button"
                role="menuitem"
                className="flex w-full items-center px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                onClick={() => {
                  onMoveToColumn(task, column.id);
                  setOpen(false);
                }}
              >
                {column.title}
              </button>
            ))}
            {destinations.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">No other columns</div>
            ) : null}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="rounded-md p-1 text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Task actions"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {menu}
    </>
  );
}

export function TaskCard({ task, columns, onOpen, onMoveToColumn }) {
  const sortableId = taskSortableId(task);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
    data: {
      type: "task",
      task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "relative rounded-lg border bg-card text-left shadow-sm outline-none transition hover:border-primary/40 hover:shadow-soft",
        isDragging && "opacity-40 ring-2 ring-primary/20"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        {...listeners}
        onClick={() => onOpen(task)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(task);
          }
        }}
        className="w-full cursor-grab rounded-lg p-3 pb-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:cursor-grabbing"
      >
        <TaskCardFace task={task} className="relative" dimmed={isDragging} />
      </div>

      <div className="absolute right-1 top-1 z-10 flex items-start" onPointerDown={(event) => event.stopPropagation()}>
        <TaskColumnMenu task={task} columns={columns} onMoveToColumn={onMoveToColumn} />
      </div>
    </div>
  );
}
