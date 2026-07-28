import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

export const getHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("correctorMessages")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const saveMessage = mutation({
  args: {
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("correctorMessages", {
      userId: args.userId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

export const chat = action({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured");

    await ctx.runMutation(api.corrector.saveMessage, {
      userId,
      role: "user",
      content: args.content,
    });

    const messages = await ctx.runQuery(api.corrector.getHistory);
    const systemPrompt = {
      role: "system" as const,
      content: "أنت مصحح ذكي لموقع مسار — منصة تعليمية لطلبة البكالوريا الجزائرية. أنت تجيب بالعربية الفصحى. مهمتك: مراجعة حلول الطالب، تصحيح الأخطاء خطوة بخطوة، شرح المفاهيم التي أخطأ فيها، وتقديم توجيهات دقيقة ومفيدة. أسلوبك ودود ومشجع."
    };

    const body = {
      model: "deepseek-chat",
      messages: [systemPrompt, ...messages.map((m) => ({ role: m.role, content: m.content }))],
      max_tokens: 2000,
      temperature: 0.7,
    };

    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${err}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) throw new Error("Empty response from DeepSeek");

    await ctx.runMutation(api.corrector.saveMessage, {
      userId,
      role: "assistant",
      content: reply,
    });

    return reply;
  },
});
