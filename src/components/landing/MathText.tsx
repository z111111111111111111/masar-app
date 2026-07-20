import { useMemo } from 'react';

/**
 * Renders text containing LaTeX math delimiters:
 *  - $$...$$  → display math (centered, block)
 *  - $...$    → inline math
 *
 * Everything else is rendered as plain text.
 * Falls back to raw text if KaTeX hasn't loaded yet.
 */
export function MathText({
  tex,
  className,
  displayMode = false,
}: {
  tex: string;
  className?: string;
  displayMode?: boolean;
}) {
  const html = useMemo(() => {
    if (displayMode) {
      return renderKatex(tex, true);
    }
    return renderInline(tex);
  }, [tex, displayMode]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Render a single KaTeX expression (display or inline). */
export function KaTeXBlock({
  tex,
  displayMode = false,
  className,
}: {
  tex: string;
  displayMode?: boolean;
  className?: string;
}) {
  const html = useMemo(() => renderKatex(tex, displayMode), [tex, displayMode]);
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderInline(text: string): string {
  // Split on $...$ (non-greedy), keeping delimiters out
  const parts = text.split(/(\$[^$]+?\$)/g);
  return parts
    .map((part) => {
      const m = part.match(/^\$(.+?)\$$/);
      if (m) return renderKatex(m[1], false);
      return escapeHtml(part);
    })
    .join('');
}

function renderKatex(tex: string, displayMode: boolean): string {
  if (typeof window === 'undefined' || !window.katex) {
    return escapeHtml(tex);
  }
  try {
    return window.katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      trust: true,
    });
  } catch {
    return escapeHtml(tex);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
