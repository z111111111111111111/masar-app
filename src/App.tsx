import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { SubjectId } from '@/lib/subjects';
import {
  computeStreak,
  type RecordsMap,
  type SubjectDayRecord,
  type TimerStatus,
} from '@/lib/dates';
import { Toaster } from '@/components/ui/toaster';
import { AuthScreen } from '@/components/AuthScreen';
import { PaymentScreen } from '@/components/PaymentScreen';
import { Landing } from '@/components/landing/Landing';
import { AppShell } from '@/components/AppShell';
import { DashboardTab } from '@/components/DashboardTab';
import { PathTab } from '@/components/PathTab';
import { RoadmapTab } from '@/components/RoadmapTab';
import { LeaderboardTab } from '@/components/LeaderboardTab';
import { ProfileTab } from '@/components/ProfileTab';
import { BackButton } from '@/components/BackButton';
import { HeartsProvider } from '@/hooks/useHearts';
import { useDayInfo } from '@/hooks/useDayInfo';
import { signOut } from '@/lib/auth-client';
import { useTheme } from '@/lib/useTheme';
import { useAppScreen, activeTab } from '@/lib/navigation';
import { subscribePaywall, openPaywall } from '@/lib/paywall';

function flatToRecordsMap(rows: any[]): RecordsMap {
  const map: RecordsMap = {};
  for (const row of rows) {
    if (!map[row.dateISO]) map[row.dateISO] = {};
    map[row.dateISO][row.subject as SubjectId] = {
      score: row.score,
      timeSeconds: row.timeSeconds,
      timerStatus: row.timerStatus as TimerStatus | undefined,
      runningSince: row.runningSince,
      viaRandom: row.viaRandom,
    } satisfies SubjectDayRecord;
  }
  return map;
}

function App() {
  const authUser = useQuery(api.progress.getAuth);
  const profile = useQuery(api.progress.get);
  const verifySub = useQuery(api.subscription.verifySubscription);
  const rawRecords = useQuery(api.progress.getRecords);
  const dayInfo = useDayInfo();
  const createProfile = useMutation(api.progress.create);
  const enforceExpiry = useMutation(api.subscription.enforceExpiry);
  const { theme, dark, themes, setTheme, toggleDark } = useTheme();

  const entitlements = useQuery(api.entitlements.get);

  const [page, setPage] = useState<'landing' | 'auth'>('landing');
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('signup');
  const [paywallOpen, setPaywallOpen] = useState(false);
  const navHistory = useRef<string[]>([]);
  const [canGoBack, setCanGoBack] = useState(false);
  const expiryEnforced = useRef(false);
  const { screen: appScreen, navigate: navigateApp } = useAppScreen({ kind: 'tab', tab: 'home' });
  const active = activeTab(appScreen);

  // Capture a referral code (?ref=...) from the URL once, at signup.
  const referralCode = useRef<string | undefined>(undefined);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref')?.trim();
    if (ref) {
      referralCode.current = ref;
      params.delete('ref');
      const qs = params.toString();
      window.history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname);
    }
  }, []);

  // App-wide paywall trigger (locked features call openPaywall()).
  useEffect(() => subscribePaywall(() => setPaywallOpen(true)), []);

  const navigate = (to: 'landing' | 'auth', authT?: 'login' | 'signup') => {
    navHistory.current.push(page);
    setCanGoBack(true);
    if (authT) setAuthTab(authT);
    setPage(to);
  };

  const goBack = () => {
    if (navHistory.current.length === 0) return;
    const prev = navHistory.current.pop() as 'landing' | 'auth';
    setCanGoBack(navHistory.current.length > 0);
    setPage(prev);
  };

  const blockBack = () => {
    navHistory.current = [];
    setCanGoBack(false);
  };

  const handlePaymentCancel = async () => {
    await signOut();
    navHistory.current = [];
    setCanGoBack(false);
    setPage('landing');
  };

  const queriesLoading = profile === undefined || rawRecords === undefined || verifySub === undefined || entitlements === undefined;
  const authLoading = authUser === undefined;
  const isAuthed = authUser !== null && authUser !== undefined;
  // For an authenticated user the server-clock day info must be ready before we
  // compute anything day-based (streak, "today"), so a tampered device clock
  // can't leak in for even one frame. Unauthenticated screens never gate on it.
  const isLoading = queriesLoading || authLoading || (isAuthed && !dayInfo.ready);

  const isPaid = entitlements?.paid ?? false;
  const hasProfile = !!profile;

  // Trial ended and user is not paid → hard gate.
  const trialBlocked = !!entitlements?.blocked;
  // Day 3+ during trial → show the reminder banner in the app shell.
  const needsReminder = !!entitlements?.needsReminder && !trialBlocked;

  const records = useMemo(
    () => (rawRecords ? flatToRecordsMap(rawRecords) : ({} as RecordsMap)),
    [rawRecords]
  );

  useEffect(() => {
    if (!isAuthed && authUser !== undefined) {
      navHistory.current = [];
      setCanGoBack(false);
      setPage('landing');
      expiryEnforced.current = false;
    }
  }, [isAuthed, authUser]);

  // When user is logged in but subscription is active & expired, persist the expiry on server
  useEffect(() => {
    if (isAuthed && !isPaid && !expiryEnforced.current) {
      expiryEnforced.current = true;
      enforceExpiry().catch(() => {});
    }
  }, [isAuthed, isPaid, enforceExpiry]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        جارٍ التحميل...
      </div>
    );
  }

  if (!isAuthed) {
    if (page === 'landing') {
      return (
        <Landing
          onGetStarted={() => navigate('auth', 'signup')}
          onLogin={() => navigate('auth', 'login')}
        />
      );
    }
    return (
      <>
        {canGoBack && <BackButton onClick={goBack} />}
        <AuthScreen defaultTab={authTab} onAuthSuccess={blockBack} />
      </>
    );
  }

  if (!hasProfile) {
    if (authUser) {
      createProfile({ name: authUser.name ?? 'طالب', referralCode: referralCode.current });
    }
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        جارٍ إعداد حسابك...
      </div>
    );
  }

  // Trial over without payment → hard gate.
  if (trialBlocked) {
    return (
      <PaymentScreen
        onCancel={handlePaymentCancel}
        reason="expired"
      />
    );
  }

  // Feature paywall opened from a locked part of the app → soft gate.
  if (paywallOpen) {
    return (
      <PaymentScreen
        onCancel={() => setPaywallOpen(false)}
        reason="trial"
      />
    );
  }

  const todayISO = dayInfo.todayISO;
  const streak = computeStreak(records, todayISO);
  const bestStreak = Math.max(profile.bestStreak, streak);
  const xp = profile.totalXP;

  return (
    <HeartsProvider>
      <AppShell
        active={active}
        onChange={(t) => navigateApp({ kind: 'tab', tab: t })}
        streak={streak}
        xp={xp}
        dark={dark}
        onToggleDark={toggleDark}
        reminder={
          needsReminder
            ? `فترة التجربة المجانية تنتهي قريباً (متبقٍ ${entitlements?.daysRemaining ?? 0} يوم). فعّل اشتراكك لفتح كل المحتوى بلا حدود.`
            : null
        }
        onSubscribe={openPaywall}
        isPaid={isPaid}
      >
        {active === 'home' && (
          <DashboardTab
            name={profile.name}
            startDate={profile.startDate}
            xp={xp}
            records={records}
            isPaid={isPaid}
            onNavigateRoadmap={() => navigateApp({ kind: 'tab', tab: 'roadmap' })}
          />
        )}
        {active === 'tracking' && (
          <PathTab startDate={profile.startDate} records={records} />
        )}
        {active === 'roadmap' && (
          <RoadmapTab screen={appScreen} navigate={navigateApp} isPaid={isPaid} onSubscribe={openPaywall} />
        )}
        {active === 'board' && <LeaderboardTab userId={profile.userId} name={profile.name} xp={xp} />}
        {active === 'profile' && (
          <ProfileTab
            name={profile.name}
            startDate={profile.startDate}
            xp={xp}
            streak={streak}
            bestStreak={bestStreak}
            records={records}
            themes={themes}
            currentTheme={theme}
            dark={dark}
            isPaid={isPaid}
            onSelectTheme={setTheme}
          />
        )}
      </AppShell>
      <Toaster />
    </HeartsProvider>
  );
}

export default App;
