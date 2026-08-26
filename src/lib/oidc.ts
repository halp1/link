import * as client from "openid-client";
import { redirect, type RequestEvent } from "@sveltejs/kit";
import { session, SESSION_COOKIE, SESSION_MAX_AGE, type SessionUser } from "./session";

export type OidcOptions = {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  sessionSecret: string;
};

const cookieBase = (secure: boolean, maxAge: number) => ({
  path: "/" as const,
  httpOnly: true,
  sameSite: "lax" as const,
  secure,
  maxAge
});

const authorizationResponseUrl = (event: RequestEvent, redirectUri: string): URL => {
  const url = new URL(redirectUri);
  url.search = event.url.search;
  return url;
};

const oauthErrorLog = (err: unknown) => {
  if (!err || typeof err !== "object") return;
  const body = err as { error?: string; error_description?: string; status?: number };
  if (typeof body.error === "string") {
    console.error(
      `[oidc] token exchange failed ${body.status ?? ""} ${body.error} ${body.error_description ?? ""}`.trim()
    );
  }
};

export const createOidcClient = (opts: OidcOptions) => {
  let configPromise: Promise<client.Configuration> | null = null;

  const getConfig = () => {
    configPromise ??= client.discovery(
      new URL(opts.issuer),
      opts.clientId,
      opts.clientSecret,
      client.ClientSecretBasic(opts.clientSecret),
      opts.issuer.startsWith("http://") ? { execute: [client.allowInsecureRequests] } : undefined
    );
    return configPromise;
  };

  const isSecure = (event: RequestEvent) =>
    event.url.protocol === "https:" || opts.redirectUri.startsWith("https:");

  return {
    startLogin: async (event: RequestEvent) => {
      const config = await getConfig();
      const codeVerifier = client.randomPKCECodeVerifier();
      const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
      const state = client.randomState();
      const secure = isSecure(event);
      event.cookies.set("oidc_verifier", codeVerifier, cookieBase(secure, 600));
      event.cookies.set("oidc_state", state, cookieBase(secure, 600));
      const url = client.buildAuthorizationUrl(config, {
        redirect_uri: opts.redirectUri,
        scope: "openid profile",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state
      });
      redirect(302, url.href);
    },

    handleCallback: async (event: RequestEvent) => {
      const verifier = event.cookies.get("oidc_verifier");
      const expectedState = event.cookies.get("oidc_state");
      event.cookies.delete("oidc_verifier", { path: "/" });
      event.cookies.delete("oidc_state", { path: "/" });
      if (!verifier || !expectedState) redirect(302, "/auth");

      const config = await getConfig();
      let tokens;
      try {
        tokens = await client.authorizationCodeGrant(config, authorizationResponseUrl(event, opts.redirectUri), {
          pkceCodeVerifier: verifier,
          expectedState
        });
      } catch (err) {
        oauthErrorLog(err);
        throw err;
      }
      const sub = tokens.claims()?.sub;
      if (!sub || !tokens.access_token) redirect(302, "/auth");

      const info = await client.fetchUserInfo(config, tokens.access_token, sub);
      const username =
        (typeof info.username === "string" && info.username) ||
        (typeof info.preferred_username === "string" && info.preferred_username) ||
        (typeof info.name === "string" && info.name) ||
        sub;

      event.cookies.set(
        SESSION_COOKIE,
        session.sign({ sub, username }, opts.sessionSecret),
        cookieBase(isSecure(event), SESSION_MAX_AGE)
      );
      redirect(302, "/");
    },

    readSession: (event: RequestEvent): SessionUser | null => {
      const token = event.cookies.get(SESSION_COOKIE);
      if (!token) return null;
      return session.verify(token, opts.sessionSecret);
    },

    logout: async (event: RequestEvent) => {
      event.cookies.delete(SESSION_COOKIE, { path: "/" });
      const config = await getConfig();
      const url = client.buildEndSessionUrl(config, {
        post_logout_redirect_uri: `${event.url.origin}/`
      });
      redirect(302, url.href);
    }
  };
};
