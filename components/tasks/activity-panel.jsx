"use client";

import { formatDistanceToNow } from "date-fns";
import { History, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function labelForColumn(id, columnTitleMap) {
  if (!id) return "—";
  return columnTitleMap[id] || id.replace(/-/g, " ");
}

function describeActivity(activity, columnTitleMap) {
  const name = activity.actor?.name || "Someone";
  const meta = activity.meta || {};

  switch (activity.type) {
    case "task_created":
      return { title: `${name} created this task`, detail: null };
    case "column_changed": {
      const fromL = labelForColumn(meta.fromStatus, columnTitleMap);
      const toL = labelForColumn(meta.toStatus, columnTitleMap);
      return {
        title: `${name} moved the card`,
        detail: `${fromL} → ${toL}`
      };
    }
    case "task_reordered":
      return {
        title: `${name} reordered this card`,
        detail: meta.column ? `In ${labelForColumn(meta.column, columnTitleMap)}` : null
      };
    case "comment_added":
      return {
        title: `${name} commented`,
        detail: meta.preview ? `“${meta.preview}${meta.preview.length >= 160 ? "…" : ""}”` : null
      };
    case "assignment_changed": {
      const prevN = meta.previousAssigneeName;
      const nextN = meta.nextAssigneeName;
      if (!prevN && nextN) return { title: `${name} assigned the task`, detail: nextN };
      if (prevN && !nextN) return { title: `${name} unassigned the task`, detail: prevN };
      return { title: `${name} changed assignee`, detail: `${prevN || "Unassigned"} → ${nextN || "Unassigned"}` };
    }
    case "task_edited": {
      const fields = Array.isArray(meta.fields) ? meta.fields.join(", ") : "details";
      return { title: `${name} updated the task`, detail: fields };
    }
    default:
      return { title: `${name} updated this task`, detail: null };
  }
}

export function ActivityPanel({ activities, columnTitleMap, className, isLoading }) {
  const map = columnTitleMap || {};

  return (
    <div className={cn("rounded-lg border bg-muted/25", className)}>
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Activity</span>
        {isLoading ? <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
      </div>
      <div className="max-h-64 space-y-0 overflow-y-auto p-2">
        {isLoading && !activities?.length ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">Loading activity…</p>
        ) : null}
        {!isLoading && (!activities || activities.length === 0) ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">No activity yet. Moves, edits, and comments show up here.</p>
        ) : null}
        {activities?.map((entry) => {
          const { title, detail } = describeActivity(entry, map);
          const when = entry.createdAt ? formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true }) : "";
          return (
            <div key={entry._id} className="flex gap-2 rounded-md px-2 py-2 text-sm hover:bg-background/80">
              <Avatar name={entry.actor?.name} className="mt-0.5 h-8 w-8 shrink-0 text-[10px]" />
              <div className="min-w-0 flex-1">
                <p className="leading-snug text-foreground">{title}</p>
                {detail ? <p className="mt-0.5 break-words text-xs text-muted-foreground">{detail}</p> : null}
                <p className="mt-1 text-[10px] text-muted-foreground/80">{when}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
