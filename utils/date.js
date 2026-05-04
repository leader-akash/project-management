import { formatDistanceToNowStrict, isPast } from "date-fns";

export function dueLabel(value) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  const suffix = isPast(date) ? "overdue" : "left";
  return `${formatDistanceToNowStrict(date)} ${suffix}`;
}

export function shortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

