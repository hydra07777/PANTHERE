import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
  rounded?: "md" | "lg" | "full";
}

export function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  const radii = {
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };
  return (
    <div
      className={cn(
        "animate-shimmer",
        radii[rounded],
        className
      )}
      aria-hidden="true"
    />
  );
}