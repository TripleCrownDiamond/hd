import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { COMPANY } from "@/lib/company";

/**
 * Transactional email.
 *
 * Two transports, chosen by which credentials are present: SMTP first — the
 * shop sends from its own domain mailbox at Hostinger — and Resend's REST API
 * as the fallback for environments that have an API key instead.
 *
 * Everything is best-effort. A shop must still take an order when the mail
 * server is unreachable, so a failure is logged and returned, never thrown. No
 * credentials are read at module load: on a host where SMTP is not configured
 * yet, importing this file must not blow up the route.
 */

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Deduplicates retries at the provider. Only Resend honours it. */
  idempotencyKey?: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
}

export interface EmailResult {
  sent: boolean;
  transport?: "smtp" | "resend";
  providerMessageId?: string;
  skipped?: "not_configured";
  error?: string;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

/**
 * `"Name" <email@example.com>` from a possibly-empty display name.
 *
 * Without a name the address is returned bare, so existing setups that only
 * set the mailbox address keep behaving exactly as before. Quotes are escaped
 * so a name can never break the header.
 */
function formatFrom(name: string | undefined, email: string): string {
  const trimmed = name?.trim();
  if (!trimmed) return email;
  return `"${trimmed.replace(/"/g, "'")}" <${email}>`;
}

/**
 * SMTP settings from the environment.
 *
 * Port 465 is implicit TLS; 587 starts plaintext and upgrades with STARTTLS.
 * Getting `secure` wrong is the usual cause of a hang, so it is derived from
 * the port rather than configured separately.
 */
function smtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  // A password legitimately contains every special character, so env loaders
  // that keep surrounding quotes (or a bash `source` that cut at an unquoted
  // `#`) must not silently break authentication: strip one matching pair.
  const password = process.env.SMTP_PASSWORD?.replace(/^(["'])(.*)\1$/, "$2");
  if (!host || !user || !password) return null;

  const port = Number(process.env.SMTP_PORT ?? 465);
  return {
    host,
    port: Number.isFinite(port) && port > 0 ? port : 465,
    secure: port === 465,
    user,
    password,
    // Most providers reject a From that is not the authenticated mailbox —
    // the address must stay SMTP_FROM_EMAIL, but the display name in front of
    // it is the shop's, so customers see the company, not "noreply".
    from: formatFrom(process.env.SMTP_FROM_NAME?.trim() || COMPANY.name, process.env.SMTP_FROM_EMAIL?.trim() || user),
  };
}

/**
 * One pooled transporter per process.
 *
 * A serverless invocation may send several mails for one order; opening a TLS
 * handshake per message is slow and some hosts rate-limit new connections.
 */
let transporter: Transporter | null = null;
let transporterKey = "";

function getTransporter(config: SmtpConfig): Transporter {
  // The password is part of the identity: a stale pooled connection built with
  // a truncated value would otherwise keep failing every send after the env
  // was corrected, until the process restarted.
  const key = `${config.host}:${config.port}:${config.user}:${config.password}`;
  if (transporter && transporterKey === key) return transporter;
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    pool: true,
    maxConnections: 3,
    // A stuck mail server must not hold an order-confirmation request open.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  transporterKey = key;
  return transporter;
}

export function emailConfigured(): boolean {
  if (smtpConfig()) return true;
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

/** Which transport a send would use, for the admin diagnostics panel. */
export function emailTransport(): "smtp" | "resend" | null {
  if (smtpConfig()) return "smtp";
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) return "resend";
  return null;
}

async function sendViaSmtp(config: SmtpConfig, input: SendEmailInput): Promise<EmailResult> {
  try {
    const info = await getTransporter(config).sendMail({
      from: config.from,
      to: Array.isArray(input.to) ? input.to.join(", ") : input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo ?? process.env.SMTP_REPLY_TO ?? undefined,
      attachments: input.attachments,
    });
    return { sent: true, transport: "smtp", providerMessageId: info.messageId };
  } catch (error) {
    // The message can carry the recipient but never the password.
    console.error("SMTP send failed", error instanceof Error ? error.message : error);
    return { sent: false, transport: "smtp", error: "smtp_failed" };
  }
}

async function sendViaResend(input: SendEmailInput): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) return { sent: false, skipped: "not_configured" };
  const from = formatFrom(process.env.RESEND_FROM_NAME?.trim() || COMPANY.name, fromEmail);

  try {
    const replyTo = input.replyTo ?? process.env.RESEND_REPLY_TO;
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
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(input.attachments
          ? {
              attachments: input.attachments.map((file) => ({
                filename: file.filename,
                content: file.content.toString("base64"),
              })),
            }
          : {}),
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("Resend send failed", response.status, detail);
      return { sent: false, transport: "resend", error: `HTTP ${response.status}` };
    }
    const payload = (await response.json()) as { id?: string };
    return { sent: true, transport: "resend", providerMessageId: payload.id };
  } catch (error) {
    console.error("Resend send threw", error);
    return { sent: false, transport: "resend", error: "network" };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<EmailResult> {
  const smtp = smtpConfig();
  if (smtp) return sendViaSmtp(smtp, input);
  return sendViaResend(input);
}

/**
 * Where the shop's own copy of every order notification goes.
 *
 * Falls back to the SMTP mailbox: a shop that configured sending but forgot to
 * name an inbox should still hear about its orders somewhere real.
 */
export function adminInbox(): string | null {
  return (
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.RESEND_ADMIN_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim() ||
    null
  );
}

/**
 * Opens a connection and authenticates without sending anything.
 * Used by the admin diagnostics so a misconfiguration surfaces before the
 * first customer order rather than after it.
 */
export async function verifyEmailTransport(): Promise<{ ok: boolean; detail: string }> {
  const smtp = smtpConfig();
  if (!smtp) {
    return emailTransport() === "resend"
      ? { ok: true, detail: "Resend-API konfiguriert (keine Vorabprüfung möglich)." }
      : { ok: false, detail: "Weder SMTP noch Resend konfiguriert." };
  }
  try {
    await getTransporter(smtp).verify();
    return { ok: true, detail: `Verbunden mit ${smtp.host}:${smtp.port} als ${smtp.user}.` };
  } catch (error) {
    return {
      ok: false,
      detail: `Verbindung zu ${smtp.host}:${smtp.port} fehlgeschlagen: ${
        error instanceof Error ? error.message : "unbekannter Fehler"
      }`,
    };
  }
}
