import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { SUBJECTS, subjectColor } from '@/lib/subjects';
import { Button } from '@/components/ui/button';
import {
  currentLeague,
  dayAverageScore,
  dayIndexFromStart,
  formatClock,
  isFinished,
  MAX_SCORE,
  subjectDailySeries,
  toISODate,
  type RecordsMap,
} from '@/lib/dates';
import { FlameIcon, TrophyIcon, ShareIcon, LogoutIcon, GiftIcon, UsersIcon, CopyIcon, CheckCircleIcon, XCircleIcon, SparklesIcon } from './icons';
import { SubjectLineChart, SubjectPercentBarChart } from './SubjectPerformanceCharts';
import { ShareProfileSheet } from './ShareProfileSheet';
import { signOut } from '@/lib/auth-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ThemeSwitcher } from './ThemeSwitcher';
import type { ThemeId, ThemeInfo } from '@/lib/useTheme';

export function ProfileTab({
  name,
  startDate,
  xp,
  streak,
  bestStreak,
  records,
  themes,
  currentTheme,
  dark,
  isPaid,
  onSelectTheme,
}: {
  name: string;
  startDate: string;
  xp: number;
  streak: number;
  bestStreak: number;
  records: RecordsMap;
  themes: ThemeInfo[];
  currentTheme: ThemeId;
  dark: boolean;
  isPaid: boolean;
  onSelectTheme: (id: ThemeId) => void;
}) {
  const setAllowSharing = useMutation(api.progress.setAllowSharing);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const { league } = currentLeague(xp);

  const daysElapsed = Math.max(1, dayIndexFromStart(startDate, toISODate(new Date())) + 1);
  const maxPossiblePerSubject = daysElapsed * MAX_SCORE;

  const perSubject = SUBJECTS.map((s) => {
    let totalScore = 0;
    let count = 0;
    let totalSeconds = 0;
    for (const rec of Object.values(records)) {
      const v = rec[s.id];
      if (typeof v?.score === 'number') {
        totalScore += v.score;
        count += 1;
      }
      if (typeof v?.timeSeconds === 'number') totalSeconds += v.timeSeconds;
    }
    return { ...s, totalScore, count, totalSeconds };
  });

  const daysActive = Object.values(records).filter((r) => SUBJECTS.some((s) => isFinished(r[s.id]))).length;
  const totalTimeSeconds = perSubject.reduce((acc, s) => acc + s.totalSeconds, 0);
  const overallAvg = (() => {
    const all = Object.values(records).map(dayAverageScore).filter((v): v is number => v !== null);
    if (!all.length) return null;
    return all.reduce((a, b) => a + b, 0) / all.length;
  })();

  const fullSeries = subjectDailySeries(records, startDate, daysElapsed);
  const percentData = perSubject.map((s) => ({
    id: s.id,
    short: s.short,
    percentage: Math.round(Math.min(100, (s.totalScore / maxPossiblePerSubject) * 100)),
  }));

  return (
    <div className="space-y-5 pt-6">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center text-xl font-bold">
          {name.slice(0, 1)}
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[hsl(var(--ink))]">{name}</h1>
          <p className="text-xs text-muted-foreground">
            منذ {new Date(startDate).toLocaleDateString('ar-DZ')} · دوري {league.name}
          </p>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          className="h-10 px-4 rounded-full border border-border bg-card text-sm font-semibold text-[hsl(var(--ink))] hover:border-[hsl(var(--sprout))] hover:bg-[hsl(var(--sprout-soft))] transition-colors flex items-center gap-2 shrink-0"
        >
          <ShareIcon size={15} />
          عرض حسابك للآخرين
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ThemeSwitcher
          themes={themes}
          currentTheme={currentTheme}
          dark={dark}
          onSelectTheme={onSelectTheme}
        />

        <button
          onClick={() => setReferralOpen(true)}
          className="w-full h-11 rounded-2xl border border-border bg-card text-sm font-semibold text-[hsl(var(--ink))] hover:bg-muted/40 transition-colors flex items-center justify-center gap-2"
        >
          <GiftIcon size={16} />
          ادعُ واربح
        </button>
      </div>

      <AccountStatus isPaid={isPaid} onUpgrade={() => setCompareOpen(true)} />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="XP الإجمالية" value={String(xp)} />
        <StatCard label="السلسلة الحالية" value={String(streak)} icon={<FlameIcon className="text-[hsl(var(--ember))]" />} />
        <StatCard label="أفضل سلسلة" value={String(bestStreak)} icon={<TrophyIcon size={16} className="text-[hsl(var(--ink))]" />} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="أيام نشطة" value={String(daysActive)} />
        <StatCard label="المعدل العام" value={overallAvg !== null ? overallAvg.toFixed(1) + `/${MAX_SCORE}` : '—'} />
        <StatCard label="وقت الحل الكلي" value={formatClock(totalTimeSeconds)} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold text-[hsl(var(--ink))] mb-1">أداؤك حسب المادة</h3>
        <p className="text-[11px] text-muted-foreground mb-3">علاماتك اليومية في كل مادة، بدلالة الأيام منذ بدايتك</p>
        <SubjectLineChart series={fullSeries} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold text-[hsl(var(--ink))] mb-3">نسبة التقدّم والإكمال</h3>
        <SubjectPercentBarChart data={percentData} />
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {SUBJECTS.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: subjectColor(s.id) }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>

      {/* Share confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-xs p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
            <DialogTitle className="text-right flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center">
                <ShareIcon size={16} />
              </span>
              <span className="flex-1">              عرض حسابك للآخرين</span>
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 py-4">
            <p className="text-sm text-[hsl(var(--ink))] leading-relaxed text-center">
              هل تريد مشاركة حسابك مع الآخرين؟ سيتمكنون من رؤية أدائك ومعلوماتك فقط بدون أي تعديل.
            </p>
          </div>
          <DialogFooter className="px-4 pb-4 flex-row gap-3 !justify-center">
            <Button
              variant="sprout"
              className="flex-1 h-10 rounded-full"
              onClick={async () => {
                await setAllowSharing({ allow: true });
                setConfirmOpen(false);
                setShareOpen(true);
              }}
            >
              نعم، شارك
            </Button>
            <button
              onClick={async () => {
                await setAllowSharing({ allow: false });
                setConfirmOpen(false);
              }}
              className="flex-1 h-10 rounded-full border border-border bg-card text-sm font-semibold text-[hsl(var(--ink))] hover:bg-muted/40 transition-colors"
            >
              لا، شكراً
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shared profile view */}
      <ShareProfileSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        name={name}
        startDate={startDate}
        xp={xp}
        streak={streak}
        bestStreak={bestStreak}
        records={records}
      />

      {/* Referral dialog */}
      <ReferralDialog open={referralOpen} onOpenChange={setReferralOpen} />

      {/* Paid vs free comparison */}
      <UpgradeCompareDialog open={compareOpen} onOpenChange={setCompareOpen} />

      {/* Sign out */}
      <button
        onClick={() => signOut()}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-full border border-[hsl(var(--coral))]/30 bg-[hsl(var(--coral))]/5 text-sm font-semibold text-[hsl(var(--coral))] hover:bg-[hsl(var(--coral))]/10 transition-colors"
      >
        <LogoutIcon size={16} />
        تسجيل الخروج
      </button>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <div className="text-base font-bold text-[hsl(var(--ink))] flex items-center justify-center gap-1.5">
        {icon}
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function ReferralDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
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
      <DialogContent className="max-w-[320px] p-0 rounded-2xl overflow-hidden" dir="rtl">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-right flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[hsl(var(--sprout))] text-white flex items-center justify-center shrink-0">
              <GiftIcon size={16} />
            </span>
            <span className="flex-1">
              ادعُ أصدقاءك واربح
              <span className="block text-[11px] font-normal text-muted-foreground leading-snug mt-0.5">
                احصل على <b>5000 دج</b> لكل 10 مدعوين يقومون بالاشتراك (الدفع عبر رابطك).
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 py-4 space-y-3">
          {stats ? (
            <>
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl bg-card border border-border p-2.5 text-center">
                  <p className="text-lg font-black text-[hsl(var(--ink))] tabular-nums">{stats.registered}</p>
                  <p className="text-[10px] text-muted-foreground">مدعو سجّل عبرك</p>
                </div>
                <div className="flex-1 rounded-xl bg-card border border-border p-2.5 text-center">
                  <p className="text-lg font-black text-[hsl(var(--sprout))] tabular-nums">{stats.paid}</p>
                  <p className="text-[10px] text-muted-foreground">مدفوع ({stats.paid}/{stats.rewardTarget})</p>
                </div>
              </div>

              <div className="rounded-xl bg-card border border-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <UsersIcon size={13} />
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

function AccountStatus({ isPaid, onUpgrade }: { isPaid: boolean; onUpgrade: () => void }) {
  if (isPaid) {
    return (
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
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
      <span className="w-9 h-9 rounded-full bg-muted text-[hsl(var(--ink))] flex items-center justify-center shrink-0">
        <UsersIcon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-[hsl(var(--ink))]">حسابك مجاني</h3>
        <p className="text-[11px] text-muted-foreground leading-snug">فعّل اشتراكك لفتح كل المميزات والاستخدام الكامل.</p>
      </div>
      <Button variant="sprout" onClick={onUpgrade} className="shrink-0 h-9 px-4 rounded-full text-xs">
        اشترك الآن
      </Button>
    </div>
  );
}

const COMPARE_ROWS = [
  { label: 'الذكاء الاصطناعي (المدرّس الذكي وشرح التمارين)', paid: 'غير محدود', free: '5 مرات' },
  { label: 'التمارين العشوائية والمؤقتة', paid: 'بلا حدود', free: '3 تمارين' },
  { label: 'مراحل المنهج والمحتوى', paid: 'كل المراحل', free: 'المرحلة الأولى فقط' },
  { label: 'توثيق الحساب رسمياً', paid: 'موثق', free: 'غير موثق' },
];

function UpgradeCompareDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] p-0 rounded-2xl overflow-hidden" dir="rtl">
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
