"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md";
  tone?: "default" | "danger";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = "md", tone = "default", className, children, ...props }, ref) => {
    const sizes = {
      sm: "h-7 w-7",
      md: "h-9 w-9",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md",
          "transition-all duration-200 ease-out-soft",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          tone === "default" &&
            "text-muted hover:text-ink hover:bg-surface-sunk",
          tone === "danger" &&
            "text-muted hover:text-terracotta hover:bg-terracotta/10",
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";