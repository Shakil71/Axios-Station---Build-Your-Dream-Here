import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/** Minimum policy: 12+ chars, at least one letter and one number. */
export function passwordPolicyError(pw: string): string | null {
  if (pw.length < 12) return "Password must be at least 12 characters.";
  if (pw.length > 128) return "Password must be at most 128 characters.";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "Password must include letters and numbers.";
  return null;
}

let dummy: Promise<string> | undefined;
/** Hash of a random value — compared against for unknown users so timing doesn't reveal which emails exist. */
export function dummyHash(): Promise<string> {
  dummy ??= bcrypt.hash(randomBytes(16).toString("hex"), COST);
  return dummy;
}
