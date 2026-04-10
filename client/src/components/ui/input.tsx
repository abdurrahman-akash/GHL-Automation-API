import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-700" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        className={cn(
          "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-offset-1 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200",
          error ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100" : "",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
