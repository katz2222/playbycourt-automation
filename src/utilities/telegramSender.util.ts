import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "env-variables";

export async function sendTelegramMessage(message: string): Promise<void> {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    console.log("✅ Telegram message sent successfully!");
  } catch (error) {
    console.error("❌ Failed to send Telegram message:", error);
  }
}
