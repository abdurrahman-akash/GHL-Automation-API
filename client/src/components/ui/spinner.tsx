import { cn } from "@/lib/utils";

type SpinnerProps = {
  size?: "sm" | "md";
  className?: string;
};

const sizeStyles = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-[3px]",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-white/30 border-t-current",
        sizeStyles[size],
        className
      )}
      aria-label="Loading"
      role="status"
    />
  );
}
