import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { SubjectId } from '@/lib/subjects';
import {
  computeStreak,
  toISODate,
  type RecordsMap,
  type DayRecord,
  type SubjectDayRecord,
  type TimerStatus,
} from '@/lib/dates';
import { Toaster } from '@/components/ui/toaster';
import { AuthScreen } from '@/components/AuthScreen';
import { PaymentScreen } from '@/components/PaymentScreen';
import { Landing } from '@/components/landing/Landing';
import { AppShell, type TabId } from '@/components/AppShell';
import { DashboardTab } from '@/components/DashboardTab';
import { PathTab } from '@/components/PathTab';
import { RoadmapTab } from '@/components/RoadmapTab';
import { LeaderboardTab } from '@/components/LeaderboardTab';
import { ProfileTab } from '@/components/ProfileTab';
import { BackButton } from '@/components/BackButton';
import { signOut } from '@/lib/auth-client';
import { useTheme } from '@/lib/useTheme';

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
  const subscription = useQuery(api.subscription.get);
  const rawRecords = useQuery(api.progress.getRecords);
  const createProfile = useMutation(api.progress.create);
  const { theme, dark, themes, setTheme, toggleDark } = useTheme();

  const [tab, setTab] = useState<TabId>('home');
  const [page, setPage] = useState<'landing' | 'auth'>('landing');
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('signup');
  const navHistory = useRef<string[]>([]);
  const [canGoBack, setCanGoBack] = useState(false);

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

  const queriesLoading = profile === undefined || rawRecords === undefined;
  const authLoading = authUser === undefined;
  const isLoading = queriesLoading || authLoading;

  const isAuthed = authUser !== null && authUser !== undefined;
  const isPaid = !!subscription && subscription.status === 'active';
  const hasProfile = !!profile;

  const records = useMemo(
    () => (rawRecords ? flatToRecordsMap(rawRecords) : ({} as RecordsMap)),
    [rawRecords]
  );

  useEffect(() => {
    if (!isAuthed && authUser !== undefined) {
      navHistory.current = [];
      setCanGoBack(false);
      setPage('landing');
    }
  }, [isAuthed, authUser]);

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

  if (!isPaid) {
    return <PaymentScreen onCancel={handlePaymentCancel} />;
  }

  if (!hasProfile) {
    if (authUser) createProfile({ name: authUser.name ?? 'طالب', email: authUser.email ?? '' });
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        جارٍ إعداد حسابك...
      </div>
    );
  }

  const todayISO = toISODate(new Date());
  const streak = computeStreak(records, todayISO);
  const bestStreak = Math.max(profile.bestStreak, streak);
  const xp = profile.totalXP;

  return (
    <>
    <AppShell active={tab} onChange={setTab} streak={streak} xp={xp}>
      {tab === 'home' && (
        <DashboardTab
          name={profile.name}
          startDate={profile.startDate}
          streak={streak}
          xp={xp}
          records={records}
        />
      )}
      {tab === 'tracking' && (
        <PathTab startDate={profile.startDate} records={records} />
      )}
      {tab === 'roadmap' && <RoadmapTab />}
      {tab === 'board' && <LeaderboardTab userId={profile.userId} name={profile.name} xp={xp} />}
      {tab === 'profile' && (
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
          onSelectTheme={setTheme}
        />
      )}
    </AppShell>
    <Toaster />
    </>
  );
}

export default App;
