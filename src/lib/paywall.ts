// Lightweight app-wide signal: any component can open the subscription
// paywall (e.g. when a locked feature is tapped). App.tsx subscribes to it.
type Listener = () => void;

const listeners = new Set<Listener>();

// Popup window opened synchronously inside a click handler (so browsers don't
// block it). PaymentScreen grabs it and navigates it to the Chargily checkout
// URL once the checkout is created server-side.
let pendingPayWindow: Window | null = null;

export function subscribePaywall(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function openPaywall(): void {
  if (typeof window !== 'undefined') {
    pendingPayWindow = window.open('', '_blank');
  }
  listeners.forEach((l) => l());
}

export function takePayWindow(): Window | null {
  const w = pendingPayWindow;
  pendingPayWindow = null;
  return w;
}

export function openPayWindow(): void {
  if (typeof window !== 'undefined') {
    pendingPayWindow = window.open('', '_blank');
  }
}

export function openCheckoutWindow(url: string): Window | null {
  const safeUrl = url.replace(/^http:\/\//i, 'https://');
  const w = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  if (w) {
    try {
      w.opener = null;
    } catch {
      /* noop */
    }
    w.location.href = safeUrl;
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
