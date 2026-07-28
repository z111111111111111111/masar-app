import { useState, useRef, useEffect } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChatIcon, SendIcon } from './icons';

export function CorrectorChatSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatAction = useAction(api.corrector.chat);
  const messages = useQuery(api.corrector.getHistory) ?? [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    try {
      await chatAction({ content: text });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-right flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center">
              <ChatIcon size={16} />
            </span>
            <span className="flex-1">المصحح الذكي</span>
          </DialogTitle>
        </DialogHeader>

        <div ref={scrollRef} className="px-4 py-4 space-y-3 bg-muted/20 min-h-[260px] max-h-[360px] overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex gap-2">
              <span className="w-7 h-7 shrink-0 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center">
                <ChatIcon size={13} />
              </span>
              <div className="bg-card border border-border rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-[hsl(var(--ink))] leading-relaxed max-w-[85%]">
                أهلاً بك، سأكون مصححك الذكي — أرسل لي حلّك وسأراجعه خطوة بخطوة.
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-white ${
                m.role === 'user' ? 'bg-[hsl(var(--sprout))]' : 'bg-[hsl(var(--ink-solid))]'
              }`}>
                <ChatIcon size={13} />
              </span>
              <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed max-w-[85%] ${
                m.role === 'user'
                  ? 'bg-[hsl(var(--sprout))] text-white rounded-tl-sm'
                  : 'bg-card border border-border rounded-tr-sm text-[hsl(var(--ink))]'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-2">
              <span className="w-7 h-7 shrink-0 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center">
                <ChatIcon size={13} />
              </span>
              <div className="bg-card border border-border rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-muted-foreground">
                جارٍ الكتابة...
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="اكتب حلّك هنا..."
            disabled={sending}
            className="flex-1 h-10 rounded-full border border-border bg-card px-4 text-sm text-[hsl(var(--ink))] placeholder:text-muted-foreground outline-none focus:border-[hsl(var(--sprout))] transition-colors disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="h-10 w-10 rounded-full bg-[hsl(var(--sprout))] text-white flex items-center justify-center hover:bg-[hsl(var(--sprout))]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <SendIcon size={16} />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
