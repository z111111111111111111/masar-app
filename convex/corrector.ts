import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-v4-flash";
const SITE_URL = "https://masar-app.vercel.app";
const SITE_NAME = "Masar";

// --- Conversations ---

export const createConversation = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.insert("correctorConversations", {
      userId: identity.subject,
      title: "محادثة جديدة",
      createdAt: Date.now(),
    });
  },
});

export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const all = await ctx.db
      .query("correctorConversations")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
    return all.filter((c) => !c.deleted);
  },
});

export const updateTitle = mutation({
  args: {
    conversationId: v.id("correctorConversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, { title: args.title });
  },
});

export const softDeleteConversation = mutation({
  args: { conversationId: v.id("correctorConversations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, { deleted: true });
  },
});

// --- Messages ---

export const getMessages = query({
  args: { conversationId: v.id("correctorConversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("correctorMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});

const saveMessage = mutation({
  args: {
    userId: v.string(),
    conversationId: v.optional(v.id("correctorConversations")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("correctorMessages", {
      userId: args.userId,
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

const createEmptyMessage = mutation({
  args: {
    userId: v.string(),
    conversationId: v.id("correctorConversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("correctorMessages", {
      userId: args.userId,
      conversationId: args.conversationId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    });
  },
});

const appendToMessage = mutation({
  args: {
    messageId: v.id("correctorMessages"),
    chunk: v.string(),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (msg) {
      await ctx.db.patch(args.messageId, { content: msg.content + args.chunk });
    }
  },
});

// --- Chat action (streaming) ---

export const chat = action({
  args: {
    conversationId: v.id("correctorConversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

    // Save user message
    await ctx.runMutation(api.corrector.saveMessage, {
      userId,
      conversationId: args.conversationId,
      role: "user",
      content: args.content,
    });

    // Get conversation history
    const history = await ctx.runQuery(api.corrector.getMessages, {
      conversationId: args.conversationId,
    });

    // If first message, generate title immediately (before streaming)
    if (history.length <= 1) {
      const conversation = await ctx.runQuery(api.corrector.getConversation, {
        conversationId: args.conversationId,
      });
      if (conversation?.title === "محادثة جديدة") {
        const title = await generateTitle(args.content, apiKey);
        await ctx.runMutation(api.corrector.updateTitle, {
          conversationId: args.conversationId,
          title,
        });
      }
    }

    // Create empty assistant message for streaming
    const msgId = await ctx.runMutation(api.corrector.createEmptyMessage, {
      userId,
      conversationId: args.conversationId,
    });

    // Build system prompt + history (exclude empty assistant message)
    const systemPrompt = {
      role: "system" as const,
      content: "أنت مصحح ذكي لموقع مسار — منصة تعليمية لطلبة البكالوريا الجزائرية. أنت تجيب بالعربية الفصحى. مهمتك: مراجعة حلول الطالب، تصحيح الأخطاء خطوة بخطوة، شرح المفاهيم التي أخطأ فيها، وتقديم توجيهات دقيقة ومفيدة. أسلوبك ودود ومشجع."
    };

    const nonEmptyMessages = history.filter(m => m.content !== "");

    const body = {
      model: MODEL,
      messages: [systemPrompt, ...nonEmptyMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))],
      max_tokens: 2000,
      temperature: 0.7,
      stream: true,
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      await ctx.runMutation(api.corrector.removeMessage, { messageId: msgId });
      const err = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${err}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullReply = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ") && line.trim() !== "data: [DONE]") {
          try {
            const json = JSON.parse(line.slice(6));
            const chunk = json.choices?.[0]?.delta?.content;
            if (chunk) {
              fullReply += chunk;
              await ctx.runMutation(api.corrector.appendToMessage, {
                messageId: msgId,
                chunk,
              });
            }
          } catch { /* skip parse errors */ }
        }
      }
    }

    if (!fullReply) {
      await ctx.runMutation(api.corrector.removeMessage, { messageId: msgId });
      throw new Error("Empty response from OpenRouter");
    }

    return fullReply;
  },
});

// --- Cleanup for failed messages ---

export const removeMessage = mutation({
  args: { messageId: v.id("correctorMessages") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.messageId);
  },
});

// --- Helper: generate a short title from the first user message ---

async function generateTitle(userMessage: string, apiKey: string): Promise<string> {
  try {
    const body = {
      model: MODEL,
      messages: [
        { role: "system" as const, content: "لخص رسالة المستخدم التالية في عنوان قصير جداً (3-5 كلمات). أعد فقط العنوان بدون علامات اقتباس." },
        { role: "user" as const, content: userMessage },
      ],
      max_tokens: 20,
      temperature: 0.3,
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return "محادثة";
    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    return data.choices?.[0]?.message?.content?.trim().slice(0, 40) || "محادثة";
  } catch {
    return "محادثة";
  }
}

export { saveMessage, createEmptyMessage, appendToMessage };

export const getConversation = query({
  args: { conversationId: v.id("correctorConversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});
