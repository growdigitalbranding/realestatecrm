"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/providers/communication";
import { SITE } from "@/lib/coach/content";

const EnquirySchema = z.object({
  name: z.string().trim().min(2, "Please tell me what to call you."),
  email: z.email("That doesn't look like an email address."),
  intent: z.enum(["coaching", "speaking", "other"]),
  message: z
    .string()
    .trim()
    .min(20, "A couple of sentences helps me give you a useful reply.")
    .max(4000, "That's longer than this box handles — email me directly instead."),
  // Honeypot: a field no human sees and every naive bot fills in.
  company: z.string().max(0).optional(),
});

export type EnquiryState = {
  status: "idle" | "sent" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "intent" | "message", string>>;
  /**
   * Echoed back on failure so the form can re-render what was typed. Without
   * this, a rejected submission clears the box someone just spent five minutes
   * writing in — the fastest way to lose an enquiry.
   */
  values?: { name: string; email: string; intent: string; message: string };
};

const INTENT_LABEL: Record<string, string> = {
  coaching: "One-on-one coaching",
  speaking: "Keynote speaking",
  other: "Something else",
};

export async function submitEnquiry(
  _previous: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    intent: String(formData.get("intent") ?? "coaching"),
    message: String(formData.get("message") ?? ""),
  };

  const parsed = EnquirySchema.safeParse({
    ...raw,
    company: formData.get("company") ?? "",
  });

  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error).fieldErrors;
    // The honeypot failing is a bot, not a person to correct. Return the same
    // success shape so it learns nothing.
    if (flattened.company) return { status: "sent" };

    return {
      status: "error",
      message: "A couple of fields need another look.",
      values: raw,
      fieldErrors: {
        name: flattened.name?.[0],
        email: flattened.email?.[0],
        intent: flattened.intent?.[0],
        message: flattened.message?.[0],
      },
    };
  }

  const { name, email, intent, message } = parsed.data;

  // Delivery goes through the app's existing provider: a real send when SMTP or
  // an API key is configured, and a logged simulation otherwise, so the form is
  // never silently broken in an environment without credentials.
  const result = await sendEmail(
    SITE.email,
    `Enquiry — ${INTENT_LABEL[intent]} — ${name}`,
    [`From: ${name} <${email}>`, `Interested in: ${INTENT_LABEL[intent]}`, "", message].join("\n"),
  );

  if (result.status === "FAILED") {
    return {
      status: "error",
      message: `That didn't send. Email me directly at ${SITE.email} and I'll pick it up there.`,
      values: raw,
    };
  }

  return {
    status: "sent",
    message: "Got it. You'll hear back from me within two working days.",
  };
}
