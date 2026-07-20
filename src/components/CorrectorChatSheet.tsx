import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChatIcon } from './icons';

export function CorrectorChatSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-right flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center">
              <ChatIcon size={16} />
            </span>
            <span className="flex-1">المصحح الذكي</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--ember-soft))] text-[hsl(var(--ember))]">
              قريباً
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 py-4 space-y-3 bg-muted/20 min-h-[200px]">
          <div className="flex gap-2">
            <span className="w-7 h-7 shrink-0 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center">
              <ChatIcon size={13} />
            </span>
            <div className="bg-card border border-border rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-[hsl(var(--ink))] leading-relaxed max-w-[85%]">
              أهلاً بك، سأكون مصححك الذكي — أراجع حلولك فور انتهائك من التمرين وأوضح لك مكامن الخطأ خطوة بخطوة.
            </div>
          </div>
          <div className="flex gap-2">
            <span className="w-7 h-7 shrink-0 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center">
              <ChatIcon size={13} />
            </span>
            <div className="bg-card border border-border rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-[hsl(var(--ink))] leading-relaxed max-w-[85%]">
              لم يتم تفعيلي بعد من طرف فريق مسار. سجّل نتائجك عبر المؤقّت في الأثناء، وسأكون جاهزاً للمساعدة قريباً.
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-border flex items-center gap-2">
          <input
            disabled
            placeholder="سيتم تفعيل المحادثة قريباً..."
            className="flex-1 h-10 rounded-full border border-border bg-muted/40 px-4 text-sm text-muted-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          <button
            disabled
            className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center disabled:cursor-not-allowed"
          >
            <ChatIcon size={16} />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
