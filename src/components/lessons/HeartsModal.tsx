import { useState } from 'react';
import { useHearts } from '@/hooks/useHearts';
import { useServerCountdown } from '@/hooks/useServerCountdown';
import { Button } from '@/components/ui/button';
import { GemIcon } from '../icons';

export function HeartsModal({ onBack }: { onBack: () => void }) {
  const { hearts, maxHearts, nextRefillAt, serverNow, refillCost, jewels, refillHearts } = useHearts();
  const [busy, setBusy] = useState(false);
  const remaining = useServerCountdown(nextRefillAt ?? 0, serverNow);

  if (hearts > 0) return null;

  const canAfford = jewels >= refillCost;
  const waitMs = (remaining ?? 0) * 1000;
  const hours = Math.floor(waitMs / 3600000);
  const minutes = Math.floor((waitMs % 3600000) / 60000);
  const seconds = Math.floor((waitMs % 60000) / 1000);

  const handleRefill = async () => {
    setBusy(true);
    await refillHearts(maxHearts);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 text-center animate-[pop-in_0.3s_ease-out]">
        <div className="text-4xl mb-3">❤️</div>
        <h2 className="text-lg font-bold text-[hsl(var(--ink))] mb-2">نفدت قلوبك</h2>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          كل إجابة خاطئة تُفقدك قلباً. اشحن القلوب بالجواهر، أو انتظر تجدّدها تلقائياً — جميع القلوب (15) تعود بعد 13 ساعة من فقدان أول قلب.
        </p>

        <p className="text-[11px] font-bold text-[hsl(var(--ember))] mb-4">
          جميع القلوب تعود بعد {hours} س و {minutes} د و {seconds} ث
        </p>

        <Button
          onClick={handleRefill}
          disabled={!canAfford || busy}
          className="w-full h-12 rounded-xl mb-3"
        >
          <span className="inline-flex items-center gap-2">
            {busy ? 'جارٍ الشحن…' : canAfford ? `اشحن كل القلوب` : 'جواهر غير كافية'}
            {!busy && canAfford && (
              <span className="inline-flex items-center gap-1">
                <GemIcon size={15} />
                {refillCost}
              </span>
            )}
          </span>
        </Button>

        {!canAfford && (
          <p className="text-[11px] text-muted-foreground mb-3">
            تحتاج {Math.max(0, refillCost - jewels)} جوهرة إضافية — اجتياز مرحلة يمنحك 100 جوهرة.
          </p>
        )}

        <button
          onClick={onBack}
          className="w-full h-11 rounded-xl border border-border bg-card hover:bg-muted/50 text-[hsl(var(--ink))] font-bold text-sm transition-all"
        >
          الرجوع إلى المسار
        </button>
      </div>
    </div>
  );
}
