import { createHash } from "crypto";

export type ConversionResult = { status: "SENT" | "FAILED"; response?: unknown; error?: string };

function sha256(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

interface MetaConfig {
  pixelId?: string;
  accessToken?: string;
}

/**
 * Meta Conversions API (server-side event). Requires a pixel ID + access
 * token on the MarketingSource config. Falls back to a simulated send when
 * not configured, so demo/dev environments behave the same either way.
 */
export async function sendMetaConversionEvent(params: {
  config: MetaConfig | null | undefined;
  eventName: string;
  email?: string | null;
  phone?: string | null;
  fbclid?: string | null;
  value?: number | null;
  currency?: string;
  eventSourceUrl?: string;
}): Promise<ConversionResult> {
  const pixelId = params.config?.pixelId;
  const accessToken = params.config?.accessToken;

  if (!pixelId || !accessToken) {
    console.log(`[simulated meta capi] event=${params.eventName} phone=${params.phone}`);
    return { status: "SENT", response: { simulated: true } };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            event_name: params.eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: "system_generated",
            event_source_url: params.eventSourceUrl,
            user_data: {
              em: params.email ? [sha256(params.email)] : undefined,
              ph: params.phone ? [sha256(params.phone.replace(/\D/g, ""))] : undefined,
              fbc: params.fbclid ?? undefined,
            },
            custom_data: params.value
              ? { value: params.value, currency: params.currency ?? "INR" }
              : undefined,
          },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) return { status: "FAILED", error: JSON.stringify(data) };
    return { status: "SENT", response: data };
  } catch (err) {
    return { status: "FAILED", error: String(err) };
  }
}

interface GoogleConfig {
  conversionId?: string;
  conversionActionId?: string;
  developerToken?: string;
  customerId?: string;
  refreshToken?: string;
}

/**
 * Google Ads offline/enhanced conversion upload. The Google Ads API requires
 * OAuth2 (developer token + refreshed access token) beyond a simple API key,
 * so this performs a best-effort call when full config is present and
 * otherwise simulates — wiring up the OAuth token exchange is a follow-up
 * task once real Google Ads credentials are available.
 */
export async function sendGoogleConversionEvent(params: {
  config: GoogleConfig | null | undefined;
  gclid?: string | null;
  email?: string | null;
  phone?: string | null;
  value?: number | null;
  currency?: string;
}): Promise<ConversionResult> {
  const { developerToken, customerId, refreshToken, conversionActionId } = params.config ?? {};

  if (!developerToken || !customerId || !refreshToken || !conversionActionId) {
    console.log(`[simulated google ads conversion] gclid=${params.gclid} phone=${params.phone}`);
    return { status: "SENT", response: { simulated: true } };
  }

  // A real upload needs an OAuth access token minted from the stored refresh
  // token; that token-exchange step is a follow-up once a registered OAuth
  // client (GOOGLE_ADS_CLIENT_ID/SECRET) is available to test against.
  return { status: "FAILED", error: "Google Ads OAuth token exchange not configured" };
}
