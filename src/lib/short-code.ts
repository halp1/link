import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const CODE_LENGTH = 8;
export const CODE_PATTERN = /^[A-Za-z0-9]{6,12}$/;

export const RESERVED_CODES = new Set([
  "auth",
  "logout",
  "links",
  "api",
  "icons",
  "manifest.webmanifest",
  "robots.txt",
  "favicon.ico"
]);

export function isValidCode(code: string): boolean {
  return CODE_PATTERN.test(code) && !RESERVED_CODES.has(code.toLowerCase());
}

export function generateShortCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let result = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return result;
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}
