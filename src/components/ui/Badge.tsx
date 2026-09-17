import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "outline";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "secondary",
  children,
  ...props
}) => {
  const variants = {
    primary: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    secondary: "bg-slate-800/80 text-slate-300 border-slate-700/60",
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    danger: "bg-red-500/15 text-red-400 border-red-500/30",
    outline: "bg-transparent text-slate-300 border-slate-700/80",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm",
          variants[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
