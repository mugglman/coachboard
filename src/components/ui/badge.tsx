import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full bg-hover px-2 py-0.5 text-[11px] font-medium text-muted-fg", className)}
      {...props}
    />
  );
}
