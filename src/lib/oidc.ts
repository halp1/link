import * as fs from "node:fs";
import * as path from "node:path";
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

export type RegisteredClient = {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type RegisterIfNeededOptions = {
  issuer: string;
  softwareId: string;
  clientName: string;
  redirectUri: string;
  credentialsPath: string;
  dcrToken?: string;
  envClientId?: string;
  envClientSecret?: string;
};

type StoredClient = RegisteredClient;

const readStored = (filePath: string): StoredClient | null => {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as Partial<StoredClient>;
    if (
      typeof parsed.issuer === "string" &&
      typeof parsed.clientId === "string" &&
      typeof parsed.clientSecret === "string" &&
      typeof parsed.redirectUri === "string"
    ) {
      return parsed as StoredClient;
    }
  } catch {
    return null;
  }
  return null;
};

const writeStored = (filePath: string, creds: StoredClient) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(creds, null, 2)}\n`, { mode: 0o600 });
};

const originOf = (redirectUri: string): string => new URL(redirectUri).origin;

const storedClientStillExists = async (
  issuer: string,
  clientId: string,
  dcrToken: string
): Promise<boolean> => {
  const statusUrl = `${new URL(issuer).origin}/api/oidc/clients/${encodeURIComponent(clientId)}`;
  try {
    const response = await fetch(statusUrl, {
      headers: { Authorization: `Bearer ${dcrToken}` }
    });
    if (response.status === 401) {
      throw new Error("AUTH_DCR_TOKEN was rejected by auth");
    }
    if (response.status === 404) return false;
    if (!response.ok) {
      console.warn(`[oidc] client status ${response.status} at ${statusUrl}; keeping stored client`);
      return true;
    }
    const payload = (await response.json()) as { exists?: boolean };
    return payload.exists === true;
  } catch (err) {
    if (err instanceof Error && err.message.includes("AUTH_DCR_TOKEN")) throw err;
    console.warn(`[oidc] client status failed; keeping stored client`, err);
    return true;
  }
};

const registerClient = async (opts: RegisterIfNeededOptions): Promise<StoredClient> => {
  if (!opts.dcrToken) {
    throw new Error("Set AUTH_DCR_TOKEN or AUTH_CLIENT_ID and AUTH_CLIENT_SECRET");
  }

  const issuer = opts.issuer.replace(/\/$/, "");
  const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
  const discovery = await fetch(discoveryUrl);
  if (!discovery.ok) {
    throw new Error(`OIDC discovery failed (${discovery.status}) at ${discoveryUrl}`);
  }
  const metadata = (await discovery.json()) as { registration_endpoint?: string };
  const registrationEndpoint = metadata.registration_endpoint ?? `${issuer}/oauth2/register`;
  const logoutOrigin = `${originOf(opts.redirectUri)}/`;
  const applicationType = opts.redirectUri.startsWith("https:") ? "web" : "native";

  const response = await fetch(registrationEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.dcrToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_name: opts.clientName,
      client_uri: originOf(opts.redirectUri),
      software_id: opts.softwareId,
      redirect_uris: [opts.redirectUri],
      post_logout_redirect_uris: [logoutOrigin],
      token_endpoint_auth_method: "client_secret_basic",
      grant_types: ["authorization_code"],
      response_types: ["code"],
      application_type: applicationType,
      scope: "openid profile"
    })
  });

  const payload = (await response.json().catch(() => ({}))) as {
    client_id?: string;
    client_secret?: string;
    error_description?: string;
    error?: string;
    message?: string;
  };

  if (!response.ok || !payload.client_id || !payload.client_secret) {
    const reason =
      payload.error_description || payload.message || payload.error || `HTTP ${response.status}`;
    throw new Error(`OIDC client registration failed: ${reason}`);
  }

  const creds: StoredClient = {
    issuer: opts.issuer,
    clientId: payload.client_id,
    clientSecret: payload.client_secret,
    redirectUri: opts.redirectUri
  };
  writeStored(opts.credentialsPath, creds);
  console.log(`[oidc] registered ${opts.clientName} as ${creds.clientId}`);
  return creds;
};

export const registerIfNeeded = async (
  opts: RegisterIfNeededOptions
): Promise<RegisteredClient> => {
  if (opts.envClientId && opts.envClientSecret) {
    return {
      issuer: opts.issuer,
      clientId: opts.envClientId,
      clientSecret: opts.envClientSecret,
      redirectUri: opts.redirectUri
    };
  }

  const stored = readStored(opts.credentialsPath);
  if (
    stored &&
    stored.issuer === opts.issuer &&
    stored.redirectUri === opts.redirectUri
  ) {
    if (!opts.dcrToken || (await storedClientStillExists(opts.issuer, stored.clientId, opts.dcrToken))) {
      console.log(`[oidc] using stored client ${stored.clientId}`);
      return stored;
    }
    console.warn(`[oidc] stored client ${stored.clientId} is not in auth; re-registering`);
  }

  return registerClient(opts);
};

const cookieBase = (secure: boolean, maxAge: number) => ({
  path: "/" as const,
  httpOnly: true,
  sameSite: "lax" as const,
  secure,
  maxAge
});

export const createOidcClient = (opts: OidcOptions) => {
  let configPromise: Promise<client.Configuration> | null = null;

  const getConfig = () => {
    configPromise ??= client.discovery(
      new URL(opts.issuer),
      opts.clientId,
      opts.clientSecret,
      undefined,
      opts.issuer.startsWith("http://") ? { execute: [client.allowInsecureRequests] } : undefined
    );
    return configPromise;
  };

  const isSecure = (event: RequestEvent) => event.url.protocol === "https:";

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
      const tokens = await client.authorizationCodeGrant(config, event.url, {
        pkceCodeVerifier: verifier,
        expectedState
      });
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
