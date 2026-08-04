// Developer/owner identity allowed to run admin-only operations (no admin UI
// auth layer yet). The subject comes from the better-auth user identity, so it
// is stable server-side and cannot be forged by the client.
export const OWNER_SUBJECT = "k173f31604ft3e4apbj6rs737d8awn6z";

export function isOwner(identity: { subject: string } | null | undefined): boolean {
  return !!identity && identity.subject === OWNER_SUBJECT;
}
