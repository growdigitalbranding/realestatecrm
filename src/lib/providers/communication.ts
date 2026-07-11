/**
 * Messaging providers. Each function calls the real API when credentials are
 * present in the environment, and otherwise logs + returns a simulated
 * "SENT" result so the rest of the app (CommunicationLog, automation, etc.)
 * behaves identically in dev/demo environments without real credentials.
 */

export type SendResult = { status: "SENT" | "FAILED"; providerId?: string; error?: string };

function simulate(channel: string, to: string, content: string): SendResult {
  console.log(`[simulated ${channel}] to=${to} content=${content.slice(0, 200)}`);
  return { status: "SENT", providerId: `sim_${Date.now()}` };
}

export async function sendWhatsApp(to: string, content: string): Promise<SendResult> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return simulate("whatsapp", to, content);

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ""),
        type: "text",
        text: { body: content },
      }),
    });
    if (!res.ok) return { status: "FAILED", error: await res.text() };
    const data = await res.json();
    return { status: "SENT", providerId: data.messages?.[0]?.id };
  } catch (err) {
    return { status: "FAILED", error: String(err) };
  }
}

export async function sendSms(to: string, content: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !authToken || !from) return simulate("sms", to, content);

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: content }),
    });
    if (!res.ok) return { status: "FAILED", error: await res.text() };
    const data = await res.json();
    return { status: "SENT", providerId: data.sid };
  } catch (err) {
    return { status: "FAILED", error: String(err) };
  }
}

export async function sendEmail(to: string, subject: string, content: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS;
  if (!apiKey || !from || !to) return simulate("email", to, content);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text: content }),
    });
    if (!res.ok) return { status: "FAILED", error: await res.text() };
    const data = await res.json();
    return { status: "SENT", providerId: data.id };
  } catch (err) {
    return { status: "FAILED", error: String(err) };
  }
}
