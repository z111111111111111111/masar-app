import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { ShieldIcon, ChevronIcon, CheckCircleIcon, WarningIcon } from './icons';
import { useSession } from '@/lib/auth-client';

// ─── Transfer details (تعدَّل من الإدارة) ─────────────────────────
export const SUBSCRIPTION_PRICE_DZD = 3000;
export const SUBSCRIPTION_DURATION = '3 أشهر';
export const PAYMENT_CCP = 'CCP: 00000000 00 00';
export const PAYMENT_EDAHABIA = 'EDAHABIA: 0000 0000 0000';
export const PAYMENT_NAME = 'مؤسسة مسار للتعليم';

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

  const initiatePayment = useMutation(api.subscription.initiatePayment);
  const verifySub = useQuery(api.subscription.verifySubscription);
  const pendingList = useQuery(api.subscription.adminListPending);
  const adminActivate = useMutation(api.subscription.adminActivate);
  const adminCancel = useMutation(api.subscription.adminCancelPending);

  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isPending = submitted || verifySub?.status === 'pending';
  const isActive = verifySub?.status === 'active';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (reference.trim().length < 4) {
      setError('أدخل مرجع العملية (مثال: رقم إيصال التحويل).');
      return;
    }
    setLoading(true);
    try {
      await initiatePayment({ reference: reference.trim() });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message ?? 'تعذّر إرسال الطلب. حاول مجدداً.');
    } finally {
      setLoading(false);
    }
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

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-background">
        {onCancel && (
          <button
            onClick={onCancel}
            className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--ink))] hover:bg-muted/60 transition-all active:scale-95"
            aria-label="الرجوع"
          >
            <ChevronIcon size={17} className="rotate-180" />
          </button>
        )}
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[hsl(var(--amber))]/15 text-[hsl(var(--amber))] flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h2 className="text-xl font-bold text-[hsl(var(--ink))] mb-2">طلبك قيد المراجعة</h2>
          <p className="text-sm text-muted-foreground mb-2">
            استلمنا طلب الاشتراك. سيقوم فريق الإدارة بتأكيد وصول التحويل وتفعيل حسابك (3 أشهر).
          </p>
          <p className="text-[11px] text-muted-foreground mb-6">
            يظهر هذا عادةً خلال ساعات العمل. سيُفتح المحتوى تلقائياً بعد التفعيل.
          </p>
          {verifySub?.status === 'pending' && (
            <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 rounded-lg px-3 py-2 mb-4" dir="ltr">
              {String(verifySub.userId).slice(0, 8)}…
            </div>
          )}
          <div className="w-5 h-5 rounded-full border-2 border-[hsl(var(--ink))] border-t-transparent animate-spin mx-auto" />
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

          {pendingList === undefined ? (
            <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
          ) : pendingList.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
              لا توجد طلبات بانتظار التأكيد.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingList.map((row) => (
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
        </div>
      </div>
    );
  }

  // ── User payment screen ─────────────────────────────────────────
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

          {/* Transfer instructions */}
          <div className="bg-[hsl(var(--sprout))]/10 border border-[hsl(var(--sprout))]/25 rounded-xl p-4 mb-5">
            <h3 className="text-sm font-bold text-[hsl(var(--ink))] mb-2 flex items-center gap-1.5">
              <ShieldIcon size={15} className="text-[hsl(var(--sprout))]" />
              تحويل يدوي عبر CCP أو EDAHABIA
            </h3>
            <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <p><span className="font-semibold text-[hsl(var(--ink))]">1.</span> حوّل المبلغ <b>{SUBSCRIPTION_PRICE_DZD} دج</b> إلى حساب: </p>
              <p className="font-mono text-[11px] bg-card border border-border rounded-lg px-3 py-2" dir="ltr">
                {PAYMENT_NAME}
                <br />{PAYMENT_CCP}
                <br />{PAYMENT_EDAHABIA}
              </p>
              <p><span className="font-semibold text-[hsl(var(--ink))]">2.</span> أدخل مرجع/رقم العملية في الحقل أدناه.</p>
              <p><span className="font-semibold text-[hsl(var(--ink))]">3.</span> سنفعّل حسابك بعد التأكد من وصول التحويل (عادة خلال ساعات).</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">مرجع العملية (رقم التحويل)</label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="مثال: 2024-00012345"
                maxLength={100}
                className="h-11 text-right"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="text-[11px] font-medium text-[hsl(var(--coral))] bg-[hsl(var(--coral))]/10 p-2.5 rounded-md flex items-start gap-2">
                <WarningIcon size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-[hsl(var(--ink-solid))] hover:bg-[hsl(var(--ink-solid))]/90 text-white font-bold mt-1 rounded-xl text-base"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  جاري الإرسال...
                </span>
              ) : (
                'أرسل طلب الاشتراك'
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <ShieldIcon size={12} />
              التفعيل يتم يدوياً بعد تأكيد التحويل.
            </p>
          </form>
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
