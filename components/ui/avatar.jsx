import { cn, getInitials } from "@/lib/utils";

function Avatar({ name, className }) {
  return (
    <div
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-secondary text-xs font-semibold text-secondary-foreground",
        className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

export { Avatar };

