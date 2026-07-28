import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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
    return await ctx.db
      .query("correctorConversations")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
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

// --- Chat action ---

export const chat = action({
  args: {
    conversationId: v.id("correctorConversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

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

    // Call Gemini Flash
    const contents = history.map((m) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }],
    }));

    const body = {
      system_instruction: {
        parts: [{
          text: "أنت مصحح ذكي لموقع مسار — منصة تعليمية لطلبة البكالوريا الجزائرية. أنت تجيب بالعربية الفصحى. مهمتك: مراجعة حلول الطالب، تصحيح الأخطاء خطوة بخطوة، شرح المفاهيم التي أخطأ فيها، وتقديم توجيهات دقيقة ومفيدة. أسلوبك ودود ومشجع."
        }],
      },
      contents,
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7,
      },
    };

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${err}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error("Empty response from Gemini");

    // Save assistant reply
    await ctx.runMutation(api.corrector.saveMessage, {
      userId,
      conversationId: args.conversationId,
      role: "assistant",
      content: reply,
    });

    // If title is still default, generate one from first user message
    const conversation = await ctx.runQuery(api.corrector.getConversation, {
      conversationId: args.conversationId,
    });
    if (conversation?.title === "محادثة جديدة" && history.length <= 1) {
      await ctx.runMutation(api.corrector.updateTitle, {
        conversationId: args.conversationId,
        title: await generateTitle(args.content, apiKey),
      });
    }

    return reply;
  },
});

// --- Helper: generate a short title from the first user message ---

async function generateTitle(userMessage: string, apiKey: string): Promise<string> {
  try {
    const body = {
      contents: [{
        role: "user" as const,
        parts: [{ text: userMessage }],
      }],
      system_instruction: {
        parts: [{
          text: "لخص رسالة المستخدم التالية في عنوان قصير جداً (3-5 كلمات). أعد فقط العنوان بدون علامات اقتباس."
        }],
      },
      generationConfig: { maxOutputTokens: 20, temperature: 0.3 },
    };

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return "محادثة";
    const data = (await response.json()) as {
      candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().slice(0, 40) || "محادثة";
  } catch {
    return "محادثة";
  }
}

export { saveMessage };

export const getConversation = query({
  args: { conversationId: v.id("correctorConversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});
