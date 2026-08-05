import type { ReactNode } from 'react';

// Only allow safe link schemes (http/https or same-site relative). Anything
// else (javascript:, data:, vbscript:, etc.) is rendered as plain text so a
// prompt-injected link can never execute script in the page origin.
function safeHref(url: string): string | undefined {
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return undefined;
}

function parseInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2]) {
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
  const blocks = content.split('\n\n');
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
