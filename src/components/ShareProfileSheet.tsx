import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type RecordsMap } from '@/lib/dates';
import { ShareIcon } from './icons';
import { UserStatsView } from './UserStatsView';

interface ShareProfileSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  name: string;
  startDate: string;
  xp: number;
  streak: number;
  bestStreak: number;
  records: RecordsMap;
}

export function ShareProfileSheet({
  open,
  onOpenChange,
  name,
  startDate,
  xp,
  streak,
  bestStreak,
  records,
}: ShareProfileSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border sticky top-0 bg-card z-10">
          <DialogTitle className="text-right flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-[hsl(var(--sprout))] text-white flex items-center justify-center">
              <ShareIcon size={16} />
            </span>
            <span className="flex-1 text-base">حسابك كما يراه الآخرون</span>
          </DialogTitle>
        </DialogHeader>

        <UserStatsView
          name={name}
          startDate={startDate}
          xp={xp}
          streak={streak}
          bestStreak={bestStreak}
          records={records}
        />
      </DialogContent>
    </Dialog>
  );
}
