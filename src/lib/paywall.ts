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

// Server-side trial/limit errors all mention "اشتراكك" — when a call fails
// with such a message, the UI can show the paywall instead of a raw error.
export function isPaywallError(message: unknown): boolean {
  return typeof message === 'string' && message.includes('اشتراكك');
}
