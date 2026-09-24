// Logo Panthère — wordmark Fraunces.
// Variante "default" (sur fond clair) et "dark" (sur fond foncé).
// Pas d'emoji. La lettre "P" italique Fraunces devient la marque visuelle.

import { cn } from "@/lib/cn";

interface LogoProps {
  variant?: "default" | "dark" | "compact";
  className?: string;
}

export function Logo({ variant = "default", className }: LogoProps) {
  const colors =
    variant === "dark"
      ? "text-white"
      : "text-ink";

  if (variant === "compact") {
    // Marque réduite : juste "P" italique en Fraunces.
    return (
      <span
        className={cn(
          "font-display italic font-light text-2xl leading-none",
          colors,
          className
        )}
        aria-label="Panthère"
      >
        P<span className="text-forest not-italic">.</span>
      </span>
    );
  }

  // Wordmark complet.
  return (
    <span
      className={cn(
        "font-display font-light text-2xl tracking-tight leading-none",
        colors,
        className
      )}
      aria-label="Panthère"
    >
      Panth<span className="italic">è</span>re
      <span className="text-forest">.</span>
    </span>
  );
}