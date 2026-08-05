import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAction, useMutation, useQuery_experimental as useQuerySafe } from 'convex/react';
import { api } from 'convex/_generated/api';
import {
  ShieldIcon,
  ChevronIcon,
  CheckCircleIcon,
  WarningIcon,
  XCircleIcon,
  CreditCardIcon,
} from './icons';
import { useSession } from '@/lib/auth-client';
import { openCheckoutWindow } from '@/lib/paywall';

// ─── Plan details (تعدَّل من الإدارة) ─────────────────────────────
export const SUBSCRIPTION_PRICE_DZD = 3500;
export const SUBSCRIPTION_DURATION = '3 أشهر';

interface PaymentScreenProps {
  onCancel?: () => void;
  reason?: 'trial' | 'expired';
}

function formatDate(ts: number | null | undefined): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('ar-DZ', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

export function PaymentScreen({ onCancel, reason = 'trial' }: PaymentScreenProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const createCheckout = useAction(api.payments.createCheckout);
  const status = useQuerySafe({ query: api.payments.getCheckoutStatus, args: {} });

  // Admin panel (manual bank-transfer flow kept as a fallback)
  const pendingListResult = useQuerySafe({ query: api.subscription.adminListPending, args: {} });
  const activeListResult = useQuerySafe({ query: api.subscription.adminListActive, args: {} });
  const adminActivate = useMutation(api.subscription.adminActivate);
  const adminCancel = useMutation(api.subscription.adminCancelPending);
  const setVerified = useMutation(api.leaderboard.setVerified);

  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin');

  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<'creating' | 'waiting' | 'error'>('creating');
  const [errorMsg, setErrorMsg] = useState('');
  const [urlOutcome] = useState<'success' | 'failure' | null>(() => {
    const p = new URLSearchParams(window.location.search).get('payment');
    if (p === 'success') return 'success';
    if (p === 'failure') return 'failure';
    return null;
  });

  const subStatus = status.data?.subscriptionStatus ?? 'loading';
  const checkoutStatus = status.data?.checkoutStatus ?? null;
  const checkoutUrl = status.data?.checkoutUrl ?? null;
  const isActive = subStatus === 'active';

  // Create the checkout once on mount and on every retry, then navigate the
  // (synchronously-opened) popup to the Chargily page.
  useEffect(() => {
    if (isActive) return;
    if (urlOutcome === 'success') {
      setPhase('waiting');
      return;
    }
    if (urlOutcome === 'failure') {
      setPhase('error');
      setErrorMsg('تعذّرت عملية الدفع. حاول مرة أخرى.');
      return;
    }
    let cancelled = false;
    setPhase('creating');
    setErrorMsg('');
    (async () => {
      try {
        const res = await createCheckout();
        if (cancelled) return;
        // Open the real Chargily URL directly in a new tab. If the browser or
        // an ad blocker blocks it, the "افتح صفحة الدفع" link below is a real
        // anchor — a direct user click that can never be blocked.
        openCheckoutWindow(res.checkoutUrl);
        setPhase('waiting');
      } catch (err: any) {
        if (cancelled) return;
        setErrorMsg(err?.message ?? 'تعذّر بدء عملية الدفع. حاول مجدداً.');
        setPhase('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [createCheckout, attempt, urlOutcome, isActive]);

  // Server-side webhook reports a failed/canceled checkout → show retry.
  useEffect(() => {
    if (phase === 'waiting' && !isActive && (checkoutStatus === 'failed' || checkoutStatus === 'canceled')) {
      setErrorMsg('تعذّرت عملية الدفع. حاول مرة أخرى.');
      setPhase('error');
    }
  }, [checkoutStatus, phase, isActive]);

  const retry = () => {
    setAttempt((a) => a + 1);
  };

  // ── Success / waiting screen ────────────────────────────────────
  if (isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-background">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
          <CheckCircleIcon size={40} className="text-[hsl(var(--sprout))] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[hsl(var(--ink))] mb-1">اشتراكك مفعّل</h2>
          <p className="text-sm text-muted-foreground">يمكنك الآن تصفح كل المحتوى.</p>
        </div>
      </div>
    );
  }

  // ── Admin panel ─────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <div className="min-h-screen px-6 py-10 bg-background">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold text-[hsl(var(--ink))]">لوحة إدارة الاشتراكات</h1>
            <button
              onClick={() => { setIsAdmin(false); window.location.hash = ''; }}
              className="text-xs text-muted-foreground underline"
            >
              عودة للمستخدم
            </button>
          </div>

          {pendingListResult.status === 'loading' && (
            <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
          )}
          {pendingListResult.status === 'error' && (
            <div className="bg-card border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
              غير مصرح — هذه اللوحة متاحة للإدارة فقط.
            </div>
          )}
          {pendingListResult.status === 'success' && pendingListResult.data.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
              لا توجد طلبات بانتظار التأكيد.
            </div>
          )}
          {pendingListResult.status === 'success' && pendingListResult.data.length > 0 && (
            <div className="flex flex-col gap-3">
              {pendingListResult.data.map((row) => (
                <div key={String(row._id)} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[hsl(var(--ink))] truncate">{row.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate" dir="ltr">{row.email}</p>
                    </div>
                    <span className="text-sm font-black text-[hsl(var(--ink))] shrink-0">
                      {row.amount} دج
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground space-y-0.5 mb-3">
                    <p>مرجع العملية: <span className="font-mono" dir="ltr">{row.paymentRef ?? '—'}</span></p>
                    <p>طلب في: {formatDate(row.requestedAt)}</p>
                    <p className="font-mono" dir="ltr">{String(row._id)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        await adminActivate({ subscriptionId: row._id as any });
                      }}
                      className="flex-1 h-9 bg-[hsl(var(--sprout))] hover:bg-[hsl(var(--sprout))]/90 text-white text-xs font-bold"
                    >
                      تأكيد الدفع وتفعيل
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => { await adminCancel({ subscriptionId: row._id as any }); }}
                      className="h-9 text-xs text-muted-foreground"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Verified badge control: only verified + paid accounts may promote/refer */}
          <h2 className="text-base font-bold text-[hsl(var(--ink))] mt-8 mb-3">المشتركون النشطون — منح التوثيق (يفتح الترويج والإحالة)</h2>
          {activeListResult.status === 'loading' && (
            <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
          )}
          {activeListResult.status === 'error' && (
            <div className="bg-card border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
              غير مصرح — هذه اللوحة متاحة للإدارة فقط.
            </div>
          )}
          {activeListResult.status === 'success' && activeListResult.data.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
              لا يوجد مشتركون نشطون بعد.
            </div>
          )}
          {activeListResult.status === 'success' && activeListResult.data.length > 0 && (
            <div className="flex flex-col gap-2">
              {activeListResult.data.map((row) => (
                <div key={String(row.subscriptionId)} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[hsl(var(--ink))] truncate">
                      {row.name}
                      {row.active ? (
                        <span className="text-[10px] font-semibold text-[hsl(var(--sprout))] mr-1">(نشط)</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-[hsl(var(--coral))] mr-1">(منتهي)</span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate" dir="ltr">{row.email}</p>
                  </div>
                  <button
                    onClick={async () => { await setVerified({ userId: row.userId, verified: !row.verified }); }}
                    className={`shrink-0 h-8 px-3 rounded-full text-[11px] font-bold transition-colors ${
                      row.verified
                        ? 'bg-[hsl(var(--sprout))]/15 text-[hsl(var(--sprout))] hover:bg-[hsl(var(--sprout))]/25'
                        : 'bg-muted text-muted-foreground hover:bg-[hsl(var(--sprout))]/15 hover:text-[hsl(var(--sprout))]'
                    }`}
                  >
                    {row.verified ? 'موثّق ✓' : 'توثيق'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── User payment flow (Chargily Pay) ────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-background">
      {onCancel && (
        <button
          onClick={onCancel}
          className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--ink))] hover:bg-muted/60 transition-all active:scale-95"
          aria-label="الرجوع"
        >
          <ChevronIcon size={17} className="rotate-180" />
        </button>
      )}

      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-4">
          {/* Header */}
          <div className="flex justify-between items-start mb-5 mt-2">
            <div>
              <h1 className="text-xl font-bold text-[hsl(var(--ink))]">
                {reason === 'expired' ? 'تجديد الاشتراك' : 'تفعيل الحساب'}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {reason === 'expired'
                  ? 'انتهت صلاحية اشتراكك. يرجى التجديد للمتابعة.'
                  : `اشتراك لمدة ${SUBSCRIPTION_DURATION} بعد فترة التجربة المجانية`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-[hsl(var(--ink))]">
                {SUBSCRIPTION_PRICE_DZD}<span className="text-sm text-muted-foreground font-medium"> دج</span>
              </div>
              <p className="text-[10px] text-muted-foreground">لمدة {SUBSCRIPTION_DURATION}</p>
            </div>
          </div>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-2.5 bg-muted/50 rounded-xl px-3.5 py-2.5 mb-5">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {(user.name ?? 'طالب').slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[hsl(var(--ink))] truncate">{user.name ?? 'طالب'}</p>
                <p className="text-[11px] text-muted-foreground truncate" dir="ltr">{user.email ?? ''}</p>
              </div>
            </div>
          )}

          {/* Phase: creating */}
          {phase === 'creating' && (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full border-2 border-[hsl(var(--ink))] border-t-transparent animate-spin mx-auto mb-4" />
              <h2 className="text-base font-bold text-[hsl(var(--ink))] mb-1">جارٍ تجهيز صفحة الدفع...</h2>
              <p className="text-xs text-muted-foreground">سيتم فتح صفحة الدفع في تبويب جديد.</p>
            </div>
          )}

          {/* Phase: waiting for payment */}
          {phase === 'waiting' && (
            <div className="text-center py-6">
              {urlOutcome === 'success' ? (
                <CheckCircleIcon size={40} className="text-[hsl(var(--sprout))] mx-auto mb-4" />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-[hsl(var(--ink))] border-t-transparent animate-spin mx-auto mb-4" />
              )}
              <h2 className="text-base font-bold text-[hsl(var(--ink))] mb-2">
                {urlOutcome === 'success' ? 'تم استلام الدفع' : 'في انتظار المصادقة على الدفع...'}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                {urlOutcome === 'success'
                  ? 'سيُفعّل حسابك تلقائياً خلال ثوانٍ. إذا لم يُفعّل، حدّث الصفحة.'
                  : 'أكمل الدفع في التبويب الجديد. إذا لم يُفتح تلقائياً اضغط "افتح صفحة الدفع" أدناه. سيُفعّل حسابك بمجرد تأكيد العملية — حتى لو أغلقت التبويب.'}
              </p>

              {urlOutcome === 'success' ? null : (
                <div className="flex flex-col gap-2.5">
                  {checkoutUrl ? (
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap border border-input bg-background text-sm font-semibold h-11 rounded-xl px-4 shadow-sm transition-all duration-75 ease-out hover:bg-accent hover:text-accent-foreground active:translate-y-[3px]"
                    >
                      <CreditCardIcon size={16} />
                      افتح صفحة الدفع
                    </a>
                  ) : (
                    <Button
                      onClick={retry}
                      variant="outline"
                      className="h-11 rounded-xl text-sm font-bold"
                    >
                      <CreditCardIcon size={16} />
                      إعادة المحاولة
                    </Button>
                  )}
                  <button
                    onClick={retry}
                    className="text-xs text-muted-foreground underline"
                  >
                    إذا أغلقت صفحة الدفع دون إتمامها — إعادة المحاولة
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Phase: error */}
          {phase === 'error' && (
            <div className="text-center py-6">
              <XCircleIcon size={40} className="text-[hsl(var(--coral))] mx-auto mb-4" />
              <h2 className="text-base font-bold text-[hsl(var(--ink))] mb-2">تعذّرت عملية الدفع</h2>
              <div className="text-[11px] font-medium text-[hsl(var(--coral))] bg-[hsl(var(--coral))]/10 p-2.5 rounded-md mb-4 flex items-start gap-2 text-right">
                <WarningIcon size={14} className="shrink-0 mt-0.5" />
                {errorMsg}
              </div>
              <div className="flex flex-col gap-2.5">
                <Button
                  onClick={retry}
                  className="h-11 bg-[hsl(var(--ink-solid))] hover:bg-[hsl(var(--ink-solid))]/90 text-white font-bold rounded-xl text-sm"
                >
                  إعادة المحاولة
                </Button>
                {onCancel && (
                  <button onClick={onCancel} className="text-xs text-muted-foreground underline">
                    العودة
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Security note */}
          <div className="flex items-center gap-1.5 justify-center mt-5 pt-4 border-t border-border">
            <ShieldIcon size={12} className="text-[hsl(var(--sprout))]" />
            <p className="text-[10px] text-muted-foreground">
              دفع آمن عبر بوابة شاريلي. يُفعّل الحساب تلقائياً بعد تأكيد الدفع.
            </p>
          </div>
        </div>

        {/* Admin access */}
        <div className="text-center">
          <button
            onClick={() => { setIsAdmin(true); window.location.hash = '#admin'; }}
            className="text-[10px] text-muted-foreground/60 underline"
          >
            إدارة الطلبات
          </button>
        </div>
      </div>
    </div>
  );
}
