import { ChevronIcon } from './icons';

interface BackButtonProps {
  onClick: () => void;
}

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--ink))] hover:bg-muted/60 transition-all active:scale-95 animate-[fade-in_0.2s_ease-out]"
      aria-label="الرجوع"
    >
      <ChevronIcon size={17} className="rotate-180" />
    </button>
  );
}
