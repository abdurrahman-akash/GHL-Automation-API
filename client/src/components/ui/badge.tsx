import { cn } from "@/lib/utils";

type BadgeVariant = "duplicate" | "unique" | "idle" | "progress" | "failed" | "unavailable";

type BadgeProps = {
  children: React.ReactNode;
  variant: BadgeVariant;
};

const badgeStyles: Record<BadgeVariant, string> = {
  duplicate: "bg-rose-100 text-rose-700 border-rose-200",
  unique: "bg-emerald-100 text-emerald-700 border-emerald-200",
  idle: "bg-slate-100 text-slate-700 border-slate-200",
  progress: "bg-amber-100 text-amber-800 border-amber-200",
  failed: "bg-rose-100 text-rose-700 border-rose-200",
  unavailable: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export function Badge({ children, variant }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        badgeStyles[variant]
      )}
    >
      {children}
    </span>
  );
}
