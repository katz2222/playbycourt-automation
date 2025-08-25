import {
  PHONE_NUMBER,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_SANDBOX_NUMBER,
} from "env-variables";
import twilio, { Twilio } from "twilio";

const client: Twilio = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
export async function sendWhatsAppMessage(message: string): Promise<void> {
  try {
    await client.messages.create({
      from: TWILIO_SANDBOX_NUMBER,
      to: PHONE_NUMBER,
      body: message,
    });
    console.log("✅ WhatsApp message sent successfully!");
  } catch (error) {
    console.error("❌ Failed to send WhatsApp message:", error);
  }
}
