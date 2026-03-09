/**
 * WhatsApp OTP delivery via Green API.
 * https://green-api.com/en/docs/api/sending/SendMessage/
 *
 * FREE tier: 300 messages/month, no credit card required.
 * Connect any personal WhatsApp number by scanning a QR code.
 *
 * Required env vars:
 *   GREEN_API_INSTANCE_ID - Instance ID from green-api.com dashboard
 *   GREEN_API_TOKEN       - API token from green-api.com dashboard
 *
 * Setup (2 min):
 *   1. Sign up at https://green-api.com (email only, no credit card)
 *   2. Create a new instance, click QR and scan with WhatsApp
 *   3. Copy Instance ID and API Token into .env
 */

const GREEN_API_BASE = "https://api.green-api.com";

export async function sendWhatsAppOtp(phone: string, code: string): Promise<void> {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const apiToken   = process.env.GREEN_API_TOKEN;

  if (!instanceId || !apiToken) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Green API credentials not configured.");
    }
    console.warn(`\n[WhatsApp OTP - Dev fallback]\n  Phone: ${phone}\n  Code:  ${code}\n  (Set GREEN_API_INSTANCE_ID + GREEN_API_TOKEN in .env to send real messages)\n`);
    return;
  }

  // chatId: E.164 without leading +, followed by @c.us
  const chatId = `${phone.startsWith("+") ? phone.slice(1) : phone}@c.us`;

  const res = await fetch(
    `${GREEN_API_BASE}/waInstance${instanceId}/sendMessage/${apiToken}`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId,
        message: `Your *Exhubb* verification code is:\n\n*${code}*\n\nExpires in 15 minutes. Never share this code with anyone.`,
      }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Green API delivery failed (${res.status}): ${JSON.stringify(err)}`);
  }
}
