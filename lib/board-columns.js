import { TASK_COLUMNS } from "@/lib/constants";

/**
 * @param {{ customLanes?: { id: string; title: string }[] } | null | undefined} project
 */
export function buildBoardColumns(project) {
  const base = TASK_COLUMNS.map((column) => ({ ...column }));
  const extras = project?.customLanes || [];
  return [
    ...base,
    ...extras.map((lane) => ({
      id: lane.id,
      title: lane.title,
      tone: "bg-violet-500"
    }))
  ];
}

export function newCustomLaneId(title) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);
  const base = slug.length >= 2 ? slug : "lane";
  const suffix = Math.random().toString(36).slice(2, 6);
  const combined = `${base}-${suffix}`;
  return combined.slice(0, 32);
}
