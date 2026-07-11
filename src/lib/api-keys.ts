import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export function generateApiKey() {
  const raw = `rtf_${randomBytes(24).toString("hex")}`;
  return { raw, prefix: raw.slice(0, 10) };
}

export async function hashApiKey(raw: string) {
  return bcrypt.hash(raw, 10);
}

export async function verifyApiKey(raw: string, hash: string) {
  return bcrypt.compare(raw, hash);
}
