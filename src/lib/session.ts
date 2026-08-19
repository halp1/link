import { createHmac } from "node:crypto";

export interface SessionUser {
  sub: string;
  username: string;
}

export const SESSION_MAX_AGE = 60 * 60 * 24;
export const SESSION_COOKIE = "session";

const b64url = (value: string) =>
  Buffer.from(value).toString("base64url");

const signPayload = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url");

export const session = {
  sign: (
    user: SessionUser,
    secret: string,
    opts?: { now?: number; maxAge?: number }
  ): string => {
    const now = opts?.now ?? Math.floor(Date.now() / 1000);
    const maxAge = opts?.maxAge ?? SESSION_MAX_AGE;
    const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = b64url(
      JSON.stringify({ sub: user.sub, username: user.username, iat: now, exp: now + maxAge })
    );
    const unsigned = `${header}.${body}`;
    return `${unsigned}.${signPayload(unsigned, secret)}`;
  },
  verify: (
    token: string,
    secret: string,
    opts?: { now?: number }
  ): SessionUser | null => {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const unsigned = `${header}.${body}`;
    if (signature !== signPayload(unsigned, secret)) return null;
    try {
      const data = JSON.parse(Buffer.from(body, "base64url").toString());
      const now = opts?.now ?? Math.floor(Date.now() / 1000);
      if (typeof data.exp !== "number" || data.exp <= now) return null;
      if (typeof data.sub !== "string" || typeof data.username !== "string") return null;
      return { sub: data.sub, username: data.username };
    } catch {
      return null;
    }
  }
};
