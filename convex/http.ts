import { httpRouter } from "convex/server";
import { authComponent, createAuth, siteUrl } from "./auth";
import { chargilyWebhook } from "./chargilyWebhook";

const http = httpRouter();

// CORS is scoped to the app origins that actually talk to the auth endpoints
// (production site + local dev). Anything else can't call the auth API with
// credentials, which blocks cross-site sign-in/out abuse.
authComponent.registerRoutes(http, createAuth, {
  cors: {
    allowedOrigins: [siteUrl, "http://localhost:5173"],
  },
});

http.route({
  path: "/webhooks/chargily",
  method: "POST",
  handler: chargilyWebhook,
});

export default http;
