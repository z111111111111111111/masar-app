import { useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';

// Shown on the tab that lands back from the Chargily checkout (?payment=...).
// This is purely a UX notice — access is granted by the webhook, never here.
// It stays open (no auto-close) and offers an explicit "go to home" action.
export function PaymentRedirectNotice() {
  const [outcome] = useState<'success' | 'failure' | null>(() => {
    const p = new URLSearchParams(window.location.search).get('payment');
    if (p === 'success') return 'success';
    if (p === 'failure') return 'failure';
    return null;
  });

  if (!outcome) return null;

  const success = outcome === 'success';

  const goHome = () => {
    // Drop the ?payment marker and load the app home. If the webhook has
    // already activated the account, the main app (paid) renders right away.
    window.location.assign(window.location.origin + window.location.pathname);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center px-6 bg-background/95 backdrop-blur-sm`}
      role="alert"
    >
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
        {success ? (
          <CheckCircleIcon size={40} className="text-[hsl(var(--sprout))] mx-auto mb-3" />
        ) : (
          <XCircleIcon size={40} className="text-[hsl(var(--coral))] mx-auto mb-3" />
        )}
        <h2 className="text-lg font-bold text-[hsl(var(--ink))] mb-1">
          {success ? 'تم الدفع بنجاح' : 'تعذّرت العملية'}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {success
            ? 'حسابك موثّق رسمياً واشتراكك يُفعّل تلقائياً خلال ثوانٍ.'
            : 'لم يتم تأكيد الدفع. عُد وحاول مجدداً من صفحة الدفع.'}
        </p>
        <Button
          onClick={goHome}
          className="w-full h-11 rounded-full bg-[hsl(var(--sprout))] hover:bg-[hsl(var(--sprout))]/90 text-white font-bold"
        >
          {success ? 'انتقل لصفحة الرئيسية' : 'العودة إلى الرئيسية'}
        </Button>
      </div>
    </div>
  );
}
