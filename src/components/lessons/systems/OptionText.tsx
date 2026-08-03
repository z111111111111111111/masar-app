import { MathText, KaTeXBlock } from '@/components/landing/MathText';

const ARABIC_RE = /[\u0600-\u06FF]/;
const DELIM_RE = /\$/;

// Renders an option string as:
//  - MathText when it mixes Arabic text and $...$ math,
//  - plain text when it is Arabic-only,
//  - KaTeX when it is pure math.
// This lets a single exercise bank mix formula choices and word choices.
export function OptionText({ tex, className }: { tex: string; className?: string }) {
  if (DELIM_RE.test(tex)) {
    return <MathText tex={tex} className={className} />;
  }
  if (ARABIC_RE.test(tex)) {
    return <span dir="rtl" className={className}>{tex}</span>;
  }
  return (
    <span dir="ltr" className={className}>
      <KaTeXBlock tex={tex} />
    </span>
  );
}
