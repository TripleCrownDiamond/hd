import "server-only";

/**
 * Send transactional email through Resend's REST API.
 *
 * The REST call is a single fetch, so there is no SDK dependency to install or
 * keep current. Everything is best-effort: a shop must still take an order when
 * the mail provider is down, so a failure is logged and swallowed rather than
 * thrown. `RESEND_API_KEY` absent simply means email is not configured yet.
 */

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  idempotencyKey?: string;
}

export interface EmailResult {
  sent: boolean;
  providerMessageId?: string;
  skipped?: "not_configured";
  error?: string;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export async function sendEmail(input: SendEmailInput): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false, skipped: "not_configured" };

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo ?? process.env.RESEND_REPLY_TO ? { reply_to: input.replyTo ?? process.env.RESEND_REPLY_TO } : {}),
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("Resend send failed", response.status, detail);
      return { sent: false, error: `HTTP ${response.status}` };
    }
    const payload = await response.json() as { id?: string };
    return { sent: true, providerMessageId: payload.id };
  } catch (error) {
    console.error("Resend send threw", error);
    return { sent: false, error: "network" };
  }
}

/** Where the shop's own copy of every order notification goes. */
export function adminInbox(): string | null {
  return process.env.RESEND_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? null;
}
