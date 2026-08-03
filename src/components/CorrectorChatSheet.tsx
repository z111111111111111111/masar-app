import { useState, useRef, useEffect } from 'react';
import { useAction, useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChatIcon, SendIcon, TrashIcon, LockIcon } from './icons';
import { MarkdownText } from './MarkdownText';
import { formatClock } from '@/lib/dates';
import { isLimitWaitError, isPaywallError, openPaywall } from '@/lib/paywall';

export function CorrectorChatSheet({
  open,
  onOpenChange,
  userName,
  aiRemaining,
  aiResetAt,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userName: string;
  aiRemaining: number | null;
  aiResetAt: number | null;
}) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewConversations, setViewConversations] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<Id<"correctorConversations"> | null>(null);
  const [waitLocked, setWaitLocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const locked = waitLocked || aiRemaining === 0;

  // Countdown to the server-side AI quota reset (server clock).
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!locked || !aiResetAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [locked, aiResetAt]);
  const msLeft = locked && aiResetAt ? Math.max(0, aiResetAt - Date.now()) : null;

  const createConversation = useMutation(api.corrector.createConversation);
  const deleteConversation = useMutation(api.corrector.softDeleteConversation);
  const conversations = useQuery(api.corrector.getConversations) ?? [];
  const messages = useQuery(api.corrector.getMessages, activeConversationId ? { conversationId: activeConversationId } : 'skip') ?? [];
  const chatAction = useAction(api.corrector.chat);

  const isStreaming = activeConversationId && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].content === '';

  useEffect(() => {
    if (!open) {
      setActiveConversationId(null);
      setViewConversations(false);
      setError(null);
      setInput('');
      setWaitLocked(false);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!sending && !isStreaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sending, isStreaming]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || creating) return;
    setInput('');
    setError(null);

    try {
      let convId = activeConversationId;
      if (!convId) {
        setCreating(true);
        convId = await createConversation();
        setActiveConversationId(convId);
        setCreating(false);
      }
      setSending(true);
      await chatAction({ conversationId: convId, content: text });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'حدث خطأ غير متوقع';
      setError(msg);
      if (isPaywallError(msg)) {
        setViewConversations(false);
        onOpenChange(false);
        openPaywall();
      } else if (isLimitWaitError(msg)) {
        setWaitLocked(true);
        setViewConversations(false);
      }
    } finally {
      setSending(false);
    }
  };

  const startNew = () => {
    setActiveConversationId(null);
    setViewConversations(false);
    setError(null);
    setInput('');
  };

  const isWelcome = !activeConversationId && !creating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-right">
            <span className="w-8 h-8 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center shrink-0">
              <ChatIcon size={16} />
            </span>
            <span className="flex-1 font-semibold text-[hsl(var(--ink))]">المصحح الذكي</span>
            {(aiRemaining !== null || waitLocked) && (
              <span className={`shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 ${
                locked ? 'bg-[hsl(var(--ember-soft))] text-[hsl(var(--ember))]' : 'bg-[hsl(var(--sprout-soft))] text-[hsl(var(--sprout))]'
              }`}>
                {locked ? 'استنفدت' : `متبقٍ ${aiRemaining}`}
              </span>
            )}
            <button
              onClick={startNew}
              className="text-[11px] font-semibold text-[hsl(var(--sprout))] hover:text-[hsl(var(--sprout))]/80 transition-colors"
            >
              + جديد
            </button>
            <button
              onClick={() => { setViewConversations((v) => !v); setError(null); }}
              className="text-[11px] font-semibold text-muted-foreground hover:text-[hsl(var(--ink))] transition-colors"
            >
              {viewConversations ? 'إغلاق' : 'السجل'}
            </button>
          </div>
        </DialogHeader>

        {viewConversations ? (
          <div className="px-4 py-4 space-y-2 min-h-[260px] max-h-[420px] overflow-y-auto">
            <button
              onClick={startNew}
              className="w-full text-right rounded-xl border border-dashed border-border p-3 text-sm font-semibold text-[hsl(var(--sprout))] hover:bg-[hsl(var(--sprout-soft))] transition-colors"
            >
              + بدء محادثة جديدة
            </button>
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا توجد محادثات سابقة</p>
            ) : (
              conversations.map((c) => (
                <div key={c._id} className="flex items-center gap-1">
                  <button
                    onClick={() => { setActiveConversationId(c._id); setViewConversations(false); }}
                    className={`flex-1 text-right rounded-xl border p-3 text-sm transition-colors ${
                      c._id === activeConversationId
                        ? 'border-[hsl(var(--sprout))] bg-[hsl(var(--sprout-soft))]'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <p className="font-semibold text-[hsl(var(--ink))] truncate">{c.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(c.createdAt).toLocaleDateString('ar-DZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteConversation({ conversationId: c._id })}
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--coral))] hover:bg-muted/60 transition-colors"
                    title="حذف المحادثة"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="px-4 py-4 space-y-3 bg-muted/20 min-h-[260px] max-h-[360px] overflow-y-auto masar-scroll">
              {isWelcome && (
                <div className="flex gap-2">
                  <span className="w-7 h-7 shrink-0 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center">
                    <ChatIcon size={13} />
                  </span>
                  <div className="bg-card border border-border rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-[hsl(var(--ink))] leading-relaxed max-w-[85%]">
                    أهلاً بك، سأكون مصححك الذكي — أرسل لي حلّك وسأراجعه خطوة بخطوة.
                  </div>
                </div>
              )}
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                const isLast = i === messages.length - 1;
                const showStreaming = !isUser && isLast && m.content === '' && isStreaming;
                return (
                  <div key={i} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-semibold text-white ${
                      isUser ? 'bg-[hsl(var(--sprout))]' : 'bg-[hsl(var(--ink-solid))]'
                    }`}>
                      {isUser ? userName.slice(0, 1) : <ChatIcon size={13} />}
                    </span>
                    <div className={`rounded-2xl px-3 py-2 leading-relaxed max-w-[85%] ${
                      isUser
                        ? 'bg-[hsl(var(--sprout))] text-white rounded-tl-sm text-sm'
                        : 'bg-card border border-border rounded-tr-sm text-[hsl(var(--ink))] text-sm'
                    }`}>
                      {showStreaming ? (
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      ) : <MarkdownText content={m.content} />}
                    </div>
                  </div>
                );
              })}
              {error && (
                <div className="text-xs text-[hsl(var(--coral))] text-center px-2">
                  {error}
                </div>
              )}
            </div>

            {locked && (
              <div className="px-4 py-3 border-t border-border bg-[hsl(var(--ember-soft))]/40">
                <div className="flex items-start gap-2">
                  <LockIcon size={15} className="text-[hsl(var(--ember))] shrink-0 mt-0.5" />
                  <p className="text-[11px] font-semibold text-[hsl(var(--ink))] leading-snug">
                    استنفدت رسائل الذكاء الاصطناعي المجانية (5) لهذا اليوم.
                    <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                      يعود رصيدك تلقائياً بعد <b dir="ltr">{formatClock(Math.ceil((msLeft ?? 0) / 1000))}</b> — بتوقيت الخادم.
                    </span>
                  </p>
                </div>
              </div>
            )}

            <div className="px-4 py-3 border-t border-border flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="اكتب حلّك هنا..."
                disabled={sending || creating || locked}
                className="flex-1 h-10 rounded-full border border-border bg-card px-4 text-sm text-[hsl(var(--ink))] placeholder:text-muted-foreground outline-none focus:border-[hsl(var(--sprout))] transition-colors disabled:opacity-50"
              />
              <Button
                variant="sprout"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={send}
                disabled={!input.trim() || sending || creating || locked}
              >
                <SendIcon size={16} />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
