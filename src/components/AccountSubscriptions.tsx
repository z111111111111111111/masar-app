import { useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { GiftIcon, UsersIcon, CopyIcon, CheckCircleIcon, XCircleIcon, SparklesIcon } from './icons';

/* ── "ادعُ واربح" tile (profile + desktop sidebar share the same dialog).
      `variant="ember"` matches the sidebar's "اشترك الآن" button style so both
      actions read as one family — green = paid status, amber = invite reward. ── */
export function ReferralButton({
  className,
  variant = 'neutral',
}: {
  className?: string;
  variant?: 'neutral' | 'ember';
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          variant === 'ember'
            ? 'w-full h-10 rounded-xl bg-[hsl(var(--ember))] text-white shadow-[0_4px_0_hsl(var(--ember-dark))] hover:bg-[hsl(var(--ember)/0.9)] active:shadow-[0_1px_0_hsl(var(--ember-dark))] active:translate-y-[3px] transition-all text-sm font-semibold inline-flex items-center justify-center gap-2'
            : 'w-full h-11 rounded-2xl border border-border bg-card text-sm font-semibold text-[hsl(var(--ink))] hover:bg-muted/40 transition-colors flex items-center justify-center gap-2',
          className
        )}
      >
        <GiftIcon size={16} />
        ادعُ واربح
      </button>
      <ReferralDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function ReferralDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const stats = useQuery(api.referrals.getMyStats);
  const claimMyCode = useMutation(api.referrals.claimMyCode);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    if (stats === null) claimMyCode().catch(() => {});
  }, [stats, claimMyCode]);

  const copy = async (text: string, kind: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard unavailable (e.g. non-secure context) → fall back to prompt.
      window.prompt('انسخ الرابط:', text);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] p-0 rounded-2xl max-h-[90dvh] overflow-y-auto gap-0" dir="rtl">
        <DialogHeader className="px-4 pt-3.5 pb-2.5 border-b border-border">
          <DialogTitle className="text-right flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[hsl(var(--sprout))] text-white flex items-center justify-center shrink-0">
              <GiftIcon size={14} />
            </span>
            <span className="flex-1">
              ادعُ أصدقاءك واربح
              <span className="block text-[10px] font-normal text-muted-foreground leading-snug mt-0.5">
                احصل على <b>5000 دج</b> لكل 10 مدعوين يشتركون عبر رابطك.
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 py-3 space-y-2.5">
          {stats ? (
            <>
              <div className="flex gap-2">
                <div className="flex-1 rounded-xl bg-card border border-border p-2 text-center">
                  <p className="text-base font-black text-[hsl(var(--ink))] tabular-nums">{stats.registered}</p>
                  <p className="text-[10px] text-muted-foreground">مدعو سجّل عبرك</p>
                </div>
                <div className="flex-1 rounded-xl bg-card border border-border p-2 text-center">
                  <p className="text-base font-black text-[hsl(var(--sprout))] tabular-nums">{stats.paid}</p>
                  <p className="text-[10px] text-muted-foreground">مدفوع ({stats.paid}/{stats.rewardTarget})</p>
                </div>
              </div>

              <div className="rounded-xl bg-card border border-border p-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <UsersIcon size={12} />
                    رمزك:
                  </span>
                  <code className="flex-1 text-xs font-mono font-bold text-[hsl(var(--ink))]" dir="ltr">{stats.code}</code>
                  <button
                    onClick={() => copy(stats.code, 'code')}
                    className="shrink-0 flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:text-[hsl(var(--ink))] hover:bg-muted/50 transition-colors"
                  >
                    <CopyIcon size={12} />
                    {copied === 'code' ? 'نُسخ' : 'نسخ'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copy(stats.link, 'link')}
                    className="flex-1 truncate rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-[10px] font-mono text-muted-foreground text-left"
                    dir="ltr"
                    title="انسخ رابط الدعوة"
                  >
                    {stats.link}
                  </button>
                  <button
                    onClick={() => copy(stats.link, 'link')}
                    className="shrink-0 flex items-center gap-1 rounded-lg bg-[hsl(var(--ink-solid))] px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-[hsl(var(--ink-solid))]/90 transition-colors"
                  >
                    <CopyIcon size={12} />
                    {copied === 'link' ? 'نُسخ' : 'نسخ الرابط'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-xs text-muted-foreground py-2">جارٍ تجهيز رمزك...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Account status (paid/verified vs free → subscribe) ──────────── */
export function AccountStatus({ isPaid, compact = false }: { isPaid: boolean; compact?: boolean }) {
  const [compareOpen, setCompareOpen] = useState(false);

  if (compact) {
    return (
      <>
        {isPaid ? (
          <div className="w-full flex items-center gap-2 rounded-xl border border-[hsl(var(--sprout))]/30 bg-[hsl(var(--sprout))]/5 px-3 py-2.5">
            <CheckCircleIcon size={15} className="text-[hsl(var(--sprout))] shrink-0" />
            <span className="flex-1 text-xs font-semibold text-[hsl(var(--ink))]">حساب مدفوع وموثق</span>
            <span className="shrink-0 rounded-full bg-[hsl(var(--sprout))]/10 text-[hsl(var(--sprout))] text-[10px] font-bold px-2 py-0.5">موثق</span>
          </div>
        ) : (
          <Button variant="sprout" onClick={() => setCompareOpen(true)} className="w-full h-10 rounded-xl">
            <SparklesIcon size={15} />
            اشترك الآن
          </Button>
        )}
        <UpgradeCompareDialog open={compareOpen} onOpenChange={setCompareOpen} />
      </>
    );
  }

  return (
    <>
      {isPaid ? (
        <div className="rounded-2xl border border-[hsl(var(--sprout))]/30 bg-[hsl(var(--sprout))]/5 p-4 flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-[hsl(var(--sprout))] text-white flex items-center justify-center shrink-0">
            <CheckCircleIcon size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[hsl(var(--ink))]">حسابك مدفوع وموثق رسمياً</h3>
            <p className="text-[11px] text-muted-foreground leading-snug">اشتراكك فعّال — كل المميزات مفتوحة بلا حدود.</p>
          </div>
          <span className="shrink-0 rounded-full bg-[hsl(var(--sprout))]/10 text-[hsl(var(--sprout))] text-[10px] font-bold px-2.5 py-1 flex items-center gap-1">
            <CheckCircleIcon size={12} />
            موثق
          </span>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-muted text-[hsl(var(--ink))] flex items-center justify-center shrink-0">
            <UsersIcon size={16} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[hsl(var(--ink))]">حسابك مجاني</h3>
            <p className="text-[11px] text-muted-foreground leading-snug">فعّل اشتراكك لفتح كل المميزات والاستخدام الكامل.</p>
          </div>
          <Button variant="sprout" onClick={() => setCompareOpen(true)} className="shrink-0 h-9 px-4 rounded-full text-xs">
            اشترك الآن
          </Button>
        </div>
      )}
      <UpgradeCompareDialog open={compareOpen} onOpenChange={setCompareOpen} />
    </>
  );
}

/* ── Paid vs free comparison ────────────────────────────────────── */
const COMPARE_ROWS = [
  { label: 'الذكاء الاصطناعي (المدرّس الذكي وشرح التمارين)', paid: 'غير محدود', free: '5 مرات' },
  { label: 'التمارين العشوائية', paid: 'بلا حدود', free: '3 تمارين' },
  { label: 'التمرين اليومي (مؤقّت مواد اليوم)', paid: 'بلا حدود', free: '3 تمارين' },
  { label: 'مراحل المنهج والمحتوى', paid: 'كل المراحل', free: 'المرحلة الأولى فقط' },
  { label: 'توثيق الحساب رسمياً', paid: 'موثق', free: 'غير موثق' },
];

export function UpgradeCompareDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] p-0 rounded-2xl max-h-[85dvh] overflow-y-auto" dir="rtl">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-right flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[hsl(var(--sprout))] text-white flex items-center justify-center shrink-0">
              <SparklesIcon size={16} />
            </span>
            <span className="flex-1">الفرق بين المدفوع والمجاني</span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 py-4 space-y-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-3 bg-muted/40 text-[10px] font-bold text-muted-foreground">
              <div className="px-2 py-2.5 text-right">الميزة</div>
              <div className="px-2 py-2.5 text-center text-[hsl(var(--sprout))]">المدفوع</div>
              <div className="px-2 py-2.5 text-center text-[hsl(var(--coral))]">المجاني</div>
            </div>
            {COMPARE_ROWS.map((row) => (
              <div key={row.label} className="grid grid-cols-3 border-t border-border text-[11px]">
                <div className="px-2 py-2.5 text-right text-[hsl(var(--ink))] font-semibold leading-snug">{row.label}</div>
                <div className="px-2 py-2.5 text-center text-[hsl(var(--sprout))] font-bold flex items-center justify-center gap-1">
                  <CheckCircleIcon size={13} />
                  {row.paid}
                </div>
                <div className="px-2 py-2.5 text-center text-[hsl(var(--coral))] font-semibold flex items-center justify-center gap-1">
                  <XCircleIcon size={13} />
                  {row.free}
                </div>
              </div>
            ))}
          </div>

          <Button variant="sprout" className="w-full h-11 rounded-full" onClick={() => {}}>
            اشترك الآن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
