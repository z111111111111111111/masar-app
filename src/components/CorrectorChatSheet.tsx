import { useState, useRef, useEffect, useCallback } from 'react';
import { useAction, useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { ChatIcon, SendIcon } from './icons';

export function CorrectorChatSheet({ open, onOpenChange, userName }: { open: boolean; onOpenChange: (v: boolean) => void; userName: string }) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewConversations, setViewConversations] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<Id<"correctorConversations"> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const createConversation = useMutation(api.corrector.createConversation);
  const conversations = useQuery(api.corrector.getConversations) ?? [];
  const messages = useQuery(api.corrector.getMessages, activeConversationId ? { conversationId: activeConversationId } : 'skip') ?? [];
  const chatAction = useAction(api.corrector.chat);

  const isStreaming = messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].content === '';

  const startNew = useCallback(async () => {
    const id = await createConversation();
    setActiveConversationId(id);
    setViewConversations(false);
    setError(null);
  }, [createConversation]);

  useEffect(() => {
    if (open && !activeConversationId) {
      startNew();
    }
    if (!open) {
      setActiveConversationId(null);
    }
  }, [open, activeConversationId, startNew]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!sending && !isStreaming && activeConversationId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sending, isStreaming, activeConversationId]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !activeConversationId) return;
    setInput('');
    setSending(true);
    setError(null);
    try {
      await chatAction({ conversationId: activeConversationId, content: text });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-right">
            <span className="w-8 h-8 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center shrink-0">
              <ChatIcon size={16} />
            </span>
            <span className="flex-1 font-semibold text-[hsl(var(--ink))]">المصحح الذكي</span>
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
                <button
                  key={c._id}
                  onClick={() => { setActiveConversationId(c._id); setViewConversations(false); }}
                  className={`w-full text-right rounded-xl border p-3 text-sm transition-colors ${
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
              ))
            )}
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="px-4 py-4 space-y-3 bg-muted/20 min-h-[260px] max-h-[360px] overflow-y-auto">
              {messages.length === 0 && !sending && (
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
                      ) : m.content}
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

            <div className="px-4 py-3 border-t border-border flex items-center gap-2">
              <input
                ref={inputRef}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
