import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function OnboardingScreen({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--sprout-soft)),transparent_45%),radial-gradient(circle_at_80%_75%,hsl(var(--ember-soft)),transparent_40%)]">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <MasarMark />
          <span className="text-2xl font-bold tracking-tight text-[hsl(var(--ink))]">مسار</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h1 className="text-lg font-bold text-[hsl(var(--ink))] mb-1">ابدأ مسارك نحو البكالوريا</h1>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            تسجيل يومي، سلسلة نجاح، وترتيب تنافسي — على مدى 9 أشهر حتى الامتحان.
          </p>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">اسمك</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: أمين"
            className="mb-4 h-11 text-right"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) onCreate(name);
            }}
          />
          <Button
            className="w-full h-11 bg-[hsl(var(--ink-solid))] hover:bg-[hsl(var(--ink-solid))]/90 text-white font-bold"
            disabled={!name.trim()}
            onClick={() => onCreate(name)}
          >
            إنشاء حسابي والانطلاق
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-5">
          مشروع مسار — مرافقك اليومي لتحضير البكالوريا
        </p>
      </div>
    </div>
  );
}

export function MasarMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11" fill="hsl(var(--ink-solid))" />
      <path
        d="M9 27C9 27 13 13 20 13C27 13 23 27 30 27"
        stroke="hsl(var(--sprout))"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="9" cy="27" r="2.4" fill="hsl(var(--ember))" />
      <circle cx="30" cy="27" r="2.4" fill="white" />
    </svg>
  );
}
