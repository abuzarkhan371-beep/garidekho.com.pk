import "server-only";

export type SmsResult = { sent: boolean; provider: string; preview?: string };

/**
 * Provider-agnostic SMS delivery. Configure SMS_PROVIDER:
 * - console: logs the OTP to the server console (local development)
 * - webhook: POSTs JSON { to, message } to SMS_API_URL with SMS_API_KEY bearer token
 * - twilio: uses Twilio's REST API with SMS_API_KEY as the auth token and
 *   SMS_SENDER_ID / account identifier supplied through SMS_API_URL-compatible config
 */
export async function sendSms(to: string, message: string): Promise<SmsResult> {
  const provider = process.env.SMS_PROVIDER ?? "console";

  if (provider === "console") {
    console.info(`[SMS:${to}] ${message}`);
    return { sent: true, provider, preview: message };
  }

  if (provider === "webhook") {
    const url = process.env.SMS_API_URL;
    if (!url) throw new Error("SMS_API_URL is required for the webhook provider");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SMS_API_KEY ?? ""}`,
      },
      body: JSON.stringify({ to, message, sender: process.env.SMS_SENDER_ID ?? "GARIDEKHO" }),
    });
    if (!response.ok) throw new Error(`SMS provider rejected request: ${response.status}`);
    return { sent: true, provider };
  }

  if (provider === "twilio") {
    const accountSid = process.env.SMS_API_URL?.match(/AC[0-9a-f]{32}/i)?.[0];
    const authToken = process.env.SMS_API_KEY;
    if (!accountSid || !authToken) throw new Error("Configure a Twilio account SID in SMS_API_URL and token in SMS_API_KEY");
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: process.env.SMS_SENDER_ID ?? "",
        Body: message,
      }),
    });
    if (!response.ok) throw new Error(`Twilio rejected request: ${response.status}`);
    return { sent: true, provider };
  }

  throw new Error(`Unsupported SMS provider: ${provider}`);
}

export function normalisePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) return `+${digits}`;
  // A leading 0 means the caller used the local format; it must be followed by
  // exactly 9 mobile digits before we convert it to +92.
  if (digits.startsWith("0")) {
    return digits.length === 11 ? `+92${digits.slice(1)}` : phone.trim();
  }
  if (digits.length === 10) return `+92${digits}`;
  return phone.trim();
}

export function isValidPakistaniPhone(phone: string) {
  return /^\+92\d{10}$/.test(normalisePhone(phone));
}
