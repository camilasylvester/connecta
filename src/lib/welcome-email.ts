/**
 * Welcome email stub — wire Resend (or similar) here later.
 * Called when an admin approves a brand or creator account.
 * Does not log personal data (email / name).
 */
export async function sendWelcomeEmail(profile: {
  email: string | null;
  displayName: string | null;
  role: string;
  brandName: string | null;
  handle: string | null;
}): Promise<void> {
  if (!profile.email) return;

  // TODO: send via Resend (or similar) using profile.email / displayName.
  // Intentionally no console logging of PII while this remains a stub.
  void profile;
}
