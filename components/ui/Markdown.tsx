// ──────────────────────────────────────────────
// Mini-parser Markdown — Panthère
// Subset volontaire : gras, italique, code inline, listes,
// titres, paragraphes, sauts de ligne. Pas de HTML, pas de tables.
// Assez pour des réponses pédagogiques propres, sûr à parser.
// ──────────────────────────────────────────────

import { Fragment, type ReactNode } from "react";

/** Sécurise un texte : échappe le HTML pour éviter l'injection. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Découpe en blocs (paragraphes, titres, listes, code blocks). */
type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "h"; level: 1 | 2 | 3; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "code"; lang?: string; text: string };

function parseBlocks(src: string): Block[] {
  const lines = src.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Ligne vide → skip
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Code block ```
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || undefined;
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // consomme le ```
      blocks.push({ kind: "code", lang, text: buf.join("\n") });
      continue;
    }

    // Titres #, ##, ###
    const h = line.match(/^(#{1,3})\s+(.+)$/);
    if (h) {
      const level = h[1].length as 1 | 2 | 3;
      blocks.push({ kind: "h", level, text: h[2] });
      i++;
      continue;
    }

    // Liste non ordonnée (-, *, •)
    if (/^[\-\*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\-\*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[\-\*•]\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    // Liste ordonnée (1. )
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    // Paragraphe : accumule jusqu'à la prochaine ligne vide / liste / titre / code
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("```") &&
      !/^#{1,3}\s+/.test(lines[i]) &&
      !/^[\-\*•]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "p", lines: buf });
  }

  return blocks;
}

/** Rendu inline : gras, italique, code inline. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // On travaille en sécurité HTML pour les bouts non-formatés, mais on
  // doit parser AVANT d'échapper pour ne pas casser les délimiteurs.
  // Solution : on split par regex autour des patterns, puis on escape les
  // fragments textes, et on reconstruit.
  const parts: ReactNode[] = [];
  // Regex globale : `**bold**`, `*italic*`, `` `code` ``
  const regex =
    /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(
        <Fragment key={`${keyPrefix}-t-${idx++}`}>
          {escapeHtml(text.slice(last, m.index))}
        </Fragment>
      );
    }
    if (m[2] !== undefined) {
      parts.push(
        <strong key={`${keyPrefix}-b-${idx++}`} className="font-semibold text-ink">
          {escapeHtml(m[2])}
        </strong>
      );
    } else if (m[4] !== undefined) {
      parts.push(
        <em key={`${keyPrefix}-i-${idx++}`} className="italic">
          {escapeHtml(m[4])}
        </em>
      );
    } else if (m[6] !== undefined) {
      parts.push(
        <code
          key={`${keyPrefix}-c-${idx++}`}
          className="px-1.5 py-0.5 mx-0.5 bg-bg border border-border-warm rounded text-[13px] font-mono text-ink"
        >
          {escapeHtml(m[6])}
        </code>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    parts.push(
      <Fragment key={`${keyPrefix}-t-${idx++}`}>
        {escapeHtml(text.slice(last))}
      </Fragment>
    );
  }
  return parts;
}

/** Composant React principal. */
export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <>
      {blocks.map((block, bi) => {
        switch (block.kind) {
          case "h":
            if (block.level === 1)
              return (
                <h1
                  key={bi}
                  className="font-display text-xl font-medium text-ink mt-3 mb-1.5 first:mt-0"
                >
                  {renderInline(block.text, `h1-${bi}`)}
                </h1>
              );
            if (block.level === 2)
              return (
                <h2
                  key={bi}
                  className="font-display text-base font-semibold text-ink mt-3 mb-1 first:mt-0"
                >
                  {renderInline(block.text, `h2-${bi}`)}
                </h2>
              );
            return (
              <h3
                key={bi}
                className="text-[14.5px] font-semibold text-ink mt-2.5 mb-1 first:mt-0"
              >
                {renderInline(block.text, `h3-${bi}`)}
              </h3>
            );
          case "ul":
            return (
              <ul
                key={bi}
                className="my-1.5 ml-4 list-disc space-y-0.5 marker:text-muted-soft"
              >
                {block.items.map((it, ii) => (
                  <li key={ii} className="text-[14.5px] leading-relaxed">
                    {renderInline(it, `ul-${bi}-${ii}`)}
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol
                key={bi}
                className="my-1.5 ml-4 list-decimal space-y-0.5 marker:text-muted-soft marker:font-medium"
              >
                {block.items.map((it, ii) => (
                  <li key={ii} className="text-[14.5px] leading-relaxed">
                    {renderInline(it, `ol-${bi}-${ii}`)}
                  </li>
                ))}
              </ol>
            );
          case "code":
            return (
              <pre
                key={bi}
                className="my-2 p-3 bg-bg border border-border-warm rounded-md overflow-x-auto text-[13px] font-mono text-ink leading-relaxed"
              >
                <code>{escapeHtml(block.text)}</code>
              </pre>
            );
          case "p":
            return (
              <p
                key={bi}
                className="text-[14.5px] leading-relaxed my-1.5 first:mt-0 last:mb-0"
              >
                {block.lines.map((line, li) => (
                  <span key={li}>
                    {renderInline(line, `p-${bi}-${li}`)}
                    {li < block.lines.length - 1 && (
                      <br />
                    )}
                  </span>
                ))}
              </p>
            );
        }
      })}
    </>
  );
}