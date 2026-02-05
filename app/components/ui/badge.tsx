import * as React from "react";
import { cn } from "~/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

const badgeVariants = {
  default: "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900",
  secondary: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50",
  destructive: "bg-red-500 text-white dark:bg-red-900",
  outline: "border border-zinc-200 text-zinc-900 dark:border-zinc-800 dark:text-zinc-50",
  success: "bg-green-500 text-white dark:bg-green-900",
  warning: "bg-yellow-500 text-white dark:bg-yellow-900",
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
