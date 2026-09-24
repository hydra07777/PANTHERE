"use client";

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const baseInputClasses = cn(
  "w-full bg-surface text-ink",
  "border border-border rounded-md",
  "px-3.5 py-2.5 text-[14px]",
  "placeholder:text-muted-soft",
  "transition-colors duration-200 ease-out-soft",
  "hover:border-ink/20",
  "focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/15",
  "disabled:opacity-50 disabled:cursor-not-allowed"
);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-ink-soft"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(baseInputClasses, className)}
          {...props}
        />
        {hint && (
          <p className="text-xs text-muted leading-snug">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, className, id, children, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[13px] font-medium text-ink-soft"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            baseInputClasses,
            "appearance-none bg-no-repeat bg-[length:14px] pr-9",
            "bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2214%22%20height=%2214%22%20fill=%22none%22%20stroke=%22%236e6e6e%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22><polyline%20points=%223%205%207%209%2011%205%22/></svg>')] bg-[right_12px_center]",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {hint && (
          <p className="text-xs text-muted leading-snug">{hint}</p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-ink-soft"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(baseInputClasses, "resize-y min-h-[80px]", className)}
          {...props}
        />
        {hint && (
          <p className="text-xs text-muted leading-snug">{hint}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";