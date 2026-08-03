import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { SMART_TEACHER_SYSTEM_PROMPT } from "./prompts";

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

    // Enforce the free-trial AI limit (5 messages shared with explanations).
    await ctx.runMutation(internal.entitlements.consumeAi, { userId });

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

    // Build system prompts: the master teacher directive (highest authority) +
    // a concise task context for this conversation.
    const systemPrompt = {
      role: "system" as const,
      content: SMART_TEACHER_SYSTEM_PROMPT,
    };
    const taskContext = {
      role: "system" as const,
      content:
        "دورك في هذه المحادثة: مراجعة حلول الطالب وتصحيحها خطوة بخطوة، ومساعدة المتعلم في المواد الخمس ضمن محتوى الدرس الجاري — لا حاجة لتوليد تمارين هنا.",
    };

    const nonEmptyMessages = history.filter((m: { role: string; content: string }) => m.content !== "");

    const body = {
      model: MODEL,
      messages: [systemPrompt, taskContext, ...nonEmptyMessages.map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content }))],
      max_tokens: 4096,
      temperature: 0.7,
      // DeepSeek V4 Flash enables "thinking" by default; reasoning tokens are
      // streamed first and can leave the response empty if we only read
      // delta.content. Disable reasoning so the model answers directly.
      reasoning: { enabled: false },
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
      signal: AbortSignal.timeout(60000),
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
    let reasoningTokens = 0;
    let streamError: string | null = null;

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
            if (json.error) {
              streamError = typeof json.error === "string" ? json.error : JSON.stringify(json.error);
              break;
            }
            const delta = json.choices?.[0]?.delta;
            const chunk = delta?.content;
            if (chunk) {
              fullReply += chunk;
              await ctx.runMutation(api.corrector.appendToMessage, {
                messageId: msgId,
                chunk,
              });
            }
            if (delta?.reasoning) {
              reasoningTokens += String(delta.reasoning).length;
            }
          } catch { /* skip parse errors */ }
        }
      }
    }

    if (streamError) {
      await ctx.runMutation(api.corrector.removeMessage, { messageId: msgId });
      throw new Error(`OpenRouter stream error: ${streamError}`);
    }

    if (!fullReply) {
      await ctx.runMutation(api.corrector.removeMessage, { messageId: msgId });
      if (reasoningTokens > 0) {
        throw new Error("استجاب النموذج بتفكير فقط دون رد فعلي — حاول مجدداً.");
      }
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
      max_tokens: 60,
      temperature: 0.3,
      reasoning: { enabled: false },
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

// --- One-shot exercise explanation (used by the AI icon in exercises) ---
// The correct answer is intentionally NOT sent: the model explains the concept
// in a simplified way so the student can solve the exercise by themselves.
const EXPLAIN_KIND_LABELS: Record<string, string> = {
  mcq: "اختيار من متعدد",
  rule: "تركيب قاعدة",
  fill: "ملء الفراغ",
  truefalse: "صحيح أو خطأ",
  sort: "ترتيب خطوات",
};

export const explainExercise = action({
  args: {
    kind: v.string(),
    info: v.string(),
    options: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Enforce the free-trial AI limit (shared with the corrector chat).
    await ctx.runMutation(internal.entitlements.consumeAi, { userId: identity.subject });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

    const kindLabel = EXPLAIN_KIND_LABELS[args.kind] ?? args.kind;
    const optionsText =
      args.options && args.options.length > 0
        ? `\nالخيارات المعروضة على الطالب: ${args.options.join(" | ")}`
        : "";

    const systemPrompt = {
      role: "system" as const,
      content: SMART_TEACHER_SYSTEM_PROMPT,
    };
    const userPrompt = `نوع التمرين: ${kindLabel}.${optionsText}\n\nمعلومة إضافية عن التمرين: ${args.info}\n\nساعد المتعلم على فهم الفكرة دون كشف الإجابة مباشرة.`;

    const body = {
      model: MODEL,
      messages: [
        systemPrompt,
        { role: "user" as const, content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.5,
      reasoning: { enabled: false },
      stream: false,
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
      const err = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${err}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return (
      data.choices?.[0]?.message?.content?.trim() ||
      "عذراً، لم أستطع صياغة الشرح الآن، حاول مجدداً."
    );
  },
});
