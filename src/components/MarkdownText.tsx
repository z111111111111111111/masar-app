import type { ReactNode } from 'react';
import katex from 'katex';

// Only allow safe link schemes (http/https or same-site relative). Anything
// else (javascript:, data:, vbscript:, etc.) is rendered as plain text so a
// prompt-injected link can never execute script in the page origin.
function safeHref(url: string): string | undefined {
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return undefined;
}

function renderKatex(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      trust: false,
    });
  } catch {
    return tex.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

// Normalize the extra LaTeX delimiters some models use into the ones the app
// renders: \[ ... \] → $$ ... $$ and \( ... \) → $ ... $.
function normalizeMathDelimiters(content: string): string {
  return content
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, m: string) => `$$${m.trim()}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, m: string) => `$${m.trim()}$`);
}

const JSON_LABELS: Record<string, string> = {
  question: 'السؤال',
  options: 'الخيارات',
  correct_index: 'الإجابة الصحيحة',
  explanation: 'الشرح',
  shuffled_pieces: 'القطع',
  correct_order: 'الترتيب الصحيح',
  rule_template: 'القاعدة',
  sentence_template: 'الجملة',
  blank_answer: 'الإجابة',
  input_mode: 'طريقة الإدخال',
  suggested_choices: 'الخيارات المقترحة',
  statement: 'العبارة',
  is_true: 'الصحة',
  shuffled_cards: 'البطاقات',
  relation_type: 'النوع',
};

function jsonLabel(key: string): string {
  return JSON_LABELS[key] ?? key;
}

function jsonValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((v) => String(v)).join(' | ');
  if (typeof value === 'boolean') return value ? 'صحيح' : 'خطأ';
  if (value === null) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Render a raw JSON object the model once dumped (e.g. a fill template) as a
// readable list instead of a wall of code.
function JsonBlock({ value }: { value: Record<string, unknown> }) {
  return (
    <div className="rounded-xl bg-muted/50 border border-border px-3 py-2 my-1 space-y-1 text-xs" dir="rtl">
      {Object.entries(value).map(([k, v]) => (
        <div key={k} className="flex flex-wrap gap-x-2 gap-y-0.5">
          <span className="font-bold text-[hsl(var(--ink))]">{jsonLabel(k)}:</span>
          <span className="text-[hsl(var(--ink))]">{jsonValue(v)}</span>
        </div>
      ))}
    </div>
  );
}

/** Inline or display LaTeX rendered through KaTeX. */
function MathSpan({ tex, displayMode = false }: { tex: string; displayMode?: boolean }) {
  return <span dangerouslySetInnerHTML={{ __html: renderKatex(tex, displayMode) }} />;
}

function parseInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // $...$ math is matched first so LaTeX like $x^*$ is never split by the
  // *italic* rule; then bold / italic / code / links.
  const regex = /(\$[^$\n]+?\$|\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[1] && match[1].startsWith('$')) {
      parts.push(<MathSpan key={parts.length} tex={match[1].slice(1, -1)} />);
    } else if (match[2]) {
      parts.push(<strong key={parts.length}><em>{match[2]}</em></strong>);
    } else if (match[3]) {
      parts.push(<strong key={parts.length}>{match[3]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={parts.length}>{match[4]}</em>);
    } else if (match[5]) {
      parts.push(<code key={parts.length} className="bg-muted/60 px-1 rounded text-[13px]">{match[5]}</code>);
    } else if (match[6]) {
      const href = safeHref(match[7]);
      parts.push(
        href
          ? <a key={parts.length} href={href} target="_blank" rel="noopener noreferrer" className="underline text-[hsl(var(--sprout))]">{match[6]}</a>
          : <span key={parts.length}>{match[6]}</span>
      );
    }
    last = regex.lastIndex;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts.length ? parts : [text];
}

function parseLine(line: string, key: number): ReactNode {
  // Headings
  const heading = line.match(/^(#{1,3})\s(.+)/);
  if (heading) {
    const Tag = heading[1].length === 1 ? 'h3' : heading[1].length === 2 ? 'h4' : 'h5';
    return <Tag key={key} className="font-bold mt-3 mb-1">{parseInline(heading[2])}</Tag>;
  }
  // Unordered list
  if (line.match(/^[-*]\s(.+)/)) {
    return <li key={key} className="list-disc mr-4 mr-5">{parseInline(line.slice(2))}</li>;
  }
  // Ordered list
  const ordered = line.match(/^\d+[.)]\s(.+)/);
  if (ordered) {
    return <li key={key} className="list-decimal mr-5">{parseInline(ordered[1])}</li>;
  }
  // Horizontal rule
  if (line.match(/^---+/)) {
    return <hr key={key} className="my-2 border-border" />;
  }
  return <span key={key}>{parseInline(line)}</span>;
}

export function MarkdownText({ content }: { content: string }) {
  const normalized = normalizeMathDelimiters(content);
  const blocks = normalized.split('\n\n');
  const elements: ReactNode[] = [];

  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    // Code block
    const codeMatch = block.match(/^```(\w*)\n([\s\S]*?)```/);
    if (codeMatch) {
      elements.push(
        <pre key={bi} className="bg-muted/60 rounded-xl px-3 py-2 text-[13px] overflow-x-auto leading-relaxed my-2 direction-ltr text-left">
          <code>{codeMatch[2]}</code>
        </pre>
      );
      continue;
    }

    // Display math: $$ ... $$
    const displayMath = block.match(/^\s*\$\$([\s\S]*?)\$\$\s*$/);
    if (displayMath) {
      elements.push(
        <div key={bi} className="my-1">
          <MathSpan tex={displayMath[1].trim()} displayMode />
        </div>
      );
      continue;
    }

    // Raw JSON the model dumped: render it as a readable list.
    const jsonBlock = block.match(/^\s*\{[\s\S]*\}\s*$/);
    if (jsonBlock) {
      try {
        const parsed: unknown = JSON.parse(block);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          elements.push(<JsonBlock key={bi} value={parsed as Record<string, unknown>} />);
          continue;
        }
      } catch { /* not valid JSON → fall through to normal text */ }
    }

    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.length === 0) continue;

    // Check if block is a list
    const isList = lines.some((l) => l.match(/^[-*]\s/) || l.match(/^\d+[.)]\s/));
    if (isList) {
      elements.push(
        <ul key={bi} className="my-1 space-y-0.5 pr-0">
          {lines.map((l, li) => {
            const item = l.replace(/^[-*]\s/, '').replace(/^\d+[.)]\s/, '');
            const listMatch = l.match(/^[-*]\s/);
            return <li key={li} className={listMatch ? 'list-disc mr-5' : 'list-decimal mr-5'}>{parseInline(item)}</li>;
          })}
        </ul>
      );
      continue;
    }

    elements.push(
      <p key={bi} className="my-1">
        {lines.map((l, li) => (
          <span key={li}>
            {parseLine(l, li)}
            {li < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  }

  return <>{elements}</>;
}
