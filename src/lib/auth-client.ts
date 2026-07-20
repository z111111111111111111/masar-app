import { createAuthClient } from "better-auth/react";
import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_CONVEX_SITE_URL || "https://adamant-panda-562.eu-west-1.convex.site",
  plugins: [convexClient(), crossDomainClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
