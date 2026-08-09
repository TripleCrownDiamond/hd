import "server-only";

/**
 * Push a message to a Telegram chat through the Bot API.
 *
 * Like email, this is best-effort and dependency-free: a missing bot token
 * means Telegram is not configured, and any failure is logged, never thrown, so
 * it can never block an order from being placed.
 */

export interface TelegramResult {
  sent: boolean;
  skipped?: "not_configured";
  error?: string;
}

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID);
}

export async function sendTelegram(text: string): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return { sent: false, skipped: "not_configured" };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("Telegram send failed", response.status, detail);
      return { sent: false, error: `HTTP ${response.status}` };
    }
    return { sent: true };
  } catch (error) {
    console.error("Telegram send threw", error);
    return { sent: false, error: "network" };
  }
}

/** Telegram HTML mode needs `<`, `>` and `&` escaped in interpolated text. */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
