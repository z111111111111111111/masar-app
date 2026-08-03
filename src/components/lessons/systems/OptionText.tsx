import { KaTeXBlock } from '@/components/landing/MathText';

const ARABIC_RE = /[\u0600-\u06FF]/;

// Renders an option string either as KaTeX (math) or as plain text (Arabic),
// so a single exercise bank can mix formula choices and word choices.
export function OptionText({ tex, className }: { tex: string; className?: string }) {
  return ARABIC_RE.test(tex) ? (
    <span dir="rtl" className={className}>{tex}</span>
  ) : (
    <span dir="ltr" className={className}>
      <KaTeXBlock tex={tex} />
    </span>
  );
}
