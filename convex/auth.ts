import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth/minimal";
import authConfig from "./auth.config";

export const siteUrl = process.env.SITE_URL ?? "https://masarlearn.vercel.app";

export const authComponent = createClient<DataModel>(components.betterAuth);

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: process.env.CONVEX_SITE_URL,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 6,
      maxPasswordLength: 128,
    },
    // Tighten better-auth's built-in rate limiting (it is on by default in
    // production with per-IP windows). The sign-up rule caps mass account
    // creation (trial farming) without an email-verification gate; the others
    // blunt brute force on login and password-reset endpoints.
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      customRules: {
        "/sign-up/email": { window: 3600, max: 5 },
        "/sign-in/email": { window: 300, max: 10 },
        "/sign-in/social": { window: 300, max: 10 },
        "/request-password-reset": { window: 3600, max: 3 },
      },
    },
    socialProviders:
      googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
          }
        : undefined,
    databaseHooks: {
      session: {
        create: {
          before: async (session, context) => {
            const internal = context?.context?.internalAdapter;
            if (!internal) return;
            const active = await internal.listSessions(session.userId, { onlyActiveSessions: true });
            await Promise.all(
              active
                .filter((s) => s.token !== session.token)
                .map((s) => internal.deleteSession(s.token))
            );
          },
        },
      },
    },
    plugins: [
      crossDomain({ siteUrl }),
      convex({ authConfig }),
    ],
  });
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});

// Lets the client decide whether to show the Google button (env vars may not
// be configured yet on the deployment).
export const getGoogleStatus = query({
  args: {},
  handler: async () => {
    return {
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    };
  },
});
