import type { ReactNode } from 'react';

export function M({ children }: { children: ReactNode }) {
  return (
    <span dir="ltr" className="font-mono font-bold">{children}</span>
  );
}
