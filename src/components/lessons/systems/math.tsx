import { KaTeXBlock } from '@/components/landing/MathText';

export function K({ tex, className }: { tex: string; className?: string }) {
  return <KaTeXBlock tex={tex} className={className} />;
}
