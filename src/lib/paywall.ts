// Lightweight app-wide signal: any component can open the subscription
// paywall (e.g. when a locked feature is tapped). App.tsx subscribes to it.
type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribePaywall(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function openPaywall(): void {
  listeners.forEach((l) => l());
}

// Opens the Chargily checkout in a new tab. Called with the real URL (never a
// blank popup) — opening the URL directly is the most reliable way to get past
// popup blockers, and it can never leave a blank tab behind.
export function openCheckoutWindow(url: string): Window | null {
  const safeUrl = url.replace(/^http:\/\//i, 'https://');
  const w = typeof window !== 'undefined' ? window.open(safeUrl, '_blank') : null;
  if (w) {
    try {
      w.opener = null;
    } catch {
      /* noop */
    }
  }
  return w;
}

// Server-side trial/limit errors all mention "اشتراكك" — when a call fails
// with such a message, the UI can show the paywall instead of a raw error.
export function isPaywallError(message: unknown): boolean {
  return typeof message === 'string' && message.includes('اشتراكك');
}

// Rolling-24h quota errors mention "24 ساعة" — the quota refills automatically
// (server clock), so the UI should show a lock + countdown, not the paywall.
export function isLimitWaitError(message: unknown): boolean {
  return typeof message === 'string' && message.includes('24 ساعة');
}
