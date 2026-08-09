import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: vi.fn(), verify: vi.fn() })) },
}));

const MAIL_VARS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM_EMAIL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RESEND_ADMIN_EMAIL",
  "ADMIN_EMAIL",
] as const;

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of MAIL_VARS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of MAIL_VARS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

async function load() {
  vi.resetModules();
  return import("./email");
}

describe("emailTransport", () => {
  it("reports nothing configured when no credentials are present", async () => {
    const { emailTransport, emailConfigured } = await load();
    expect(emailTransport()).toBeNull();
    expect(emailConfigured()).toBe(false);
  });

  it("prefers SMTP when both transports are configured", async () => {
    process.env.SMTP_HOST = "smtp.hostinger.com";
    process.env.SMTP_USER = "noreply@example.de";
    process.env.SMTP_PASSWORD = "secret";
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_FROM_EMAIL = "shop@example.de";

    const { emailTransport } = await load();
    expect(emailTransport()).toBe("smtp");
  });

  it("falls back to Resend when SMTP is incomplete", async () => {
    // Host and user but no password: not usable, must not be reported as SMTP.
    process.env.SMTP_HOST = "smtp.hostinger.com";
    process.env.SMTP_USER = "noreply@example.de";
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_FROM_EMAIL = "shop@example.de";

    const { emailTransport } = await load();
    expect(emailTransport()).toBe("resend");
  });
});

describe("adminInbox", () => {
  it("returns null when nothing is set", async () => {
    const { adminInbox } = await load();
    expect(adminInbox()).toBeNull();
  });

  it("prefers ADMIN_EMAIL", async () => {
    process.env.ADMIN_EMAIL = "chef@example.de";
    process.env.RESEND_ADMIN_EMAIL = "alt@example.de";
    process.env.SMTP_USER = "noreply@example.de";

    const { adminInbox } = await load();
    expect(adminInbox()).toBe("chef@example.de");
  });

  it("falls back to the SMTP mailbox rather than dropping the notification", async () => {
    process.env.SMTP_USER = "noreply@example.de";
    const { adminInbox } = await load();
    expect(adminInbox()).toBe("noreply@example.de");
  });
});

describe("verifyEmailTransport", () => {
  it("fails clearly when nothing is configured", async () => {
    const { verifyEmailTransport } = await load();
    const result = await verifyEmailTransport();
    expect(result.ok).toBe(false);
    expect(result.detail).toMatch(/weder smtp noch resend/i);
  });
});

describe("sendEmail", () => {
  it("skips instead of throwing when unconfigured", async () => {
    const { sendEmail } = await load();
    const result = await sendEmail({
      to: "kunde@example.de",
      subject: "Test",
      text: "Test",
      html: "<p>Test</p>",
    });
    expect(result.sent).toBe(false);
    expect(result.skipped).toBe("not_configured");
  });
});
