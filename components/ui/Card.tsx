import { cn } from "@/lib/cn";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  as?: "div" | "article" | "section";
}

export function Card({ className, children, as: Tag = "div" }: CardProps) {
  return (
    <Tag
      className={cn(
        "bg-surface border border-border rounded-lg",
        "shadow-xs",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("px-5 py-4 border-b border-border-warm", className)}>
      {children}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("px-5 py-4 border-t border-border-warm bg-surface-sunk rounded-b-lg", className)}>
      {children}
    </div>
  );
}