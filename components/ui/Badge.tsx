import { cn } from "@/lib/cn";

type Tone = "neutral" | "forest" | "gold" | "terracotta" | "muted";

interface BadgeProps {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-sunk text-ink-soft border-border",
  forest: "bg-forest-soft text-forest border-forest/15",
  gold: "bg-gold-soft text-ink border-gold/20",
  terracotta: "bg-terracotta/10 text-terracotta border-terracotta/20",
  muted: "bg-bg text-muted border-border",
};

export function Badge({ tone = "neutral", className, children, icon }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "px-2 py-0.5 rounded-full",
        "text-[11px] font-medium tracking-wide",
        "border",
        toneClasses[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}