import { createAuthClient } from "better-auth/react";
import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_CONVEX_SITE_URL,
  plugins: [convexClient(), crossDomainClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

// Google OAuth: better-auth performs the redirect to Google then back to the
// callback. Requires GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET on the Convex
// deployment (see convex/auth.ts getGoogleStatus).
export async function signInWithGoogle(): Promise<{ error?: string }> {
  try {
    const res = await signIn.social({ provider: "google", callbackURL: "/" });
    if (res.error) return { error: res.error.message ?? "تعذر تسجيل الدخول عبر Google" };
    return {};
  } catch (err: any) {
    return { error: err?.message ?? "تعذر تسجيل الدخول عبر Google" };
  }
}
