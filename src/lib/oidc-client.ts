import path from "node:path";
import { env } from "$env/dynamic/private";
import { createOidcClient, registerIfNeeded } from "./oidc";

const required = (key: string): string => {
  const value = env[key];
  if (!value) throw new Error(`Missing env ${key}`);
  return value;
};

type OidcRp = ReturnType<typeof createOidcClient>;
let oidcPromise: Promise<OidcRp> | null = null;

export const getOidc = (): Promise<OidcRp> => {
  oidcPromise ??= (async () => {
    const issuer = required("AUTH_ISSUER");
    const sessionSecret = required("SESSION_SECRET");
    const publicOrigin = (env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
    const redirectUri =
      env.AUTH_REDIRECT_URI || (publicOrigin ? `${publicOrigin}/auth/callback` : "");
    if (!redirectUri) {
      throw new Error("Set AUTH_REDIRECT_URI or PUBLIC_BASE_URL");
    }

    const creds = await registerIfNeeded({
      issuer,
      softwareId: "link",
      clientName: "HALP/LINK",
      redirectUri,
      credentialsPath: path.join(process.cwd(), "data", "oidc-client.json"),
      dcrToken: env.AUTH_DCR_TOKEN,
      envClientId: env.AUTH_CLIENT_ID,
      envClientSecret: env.AUTH_CLIENT_SECRET
    });

    return createOidcClient({
      issuer: creds.issuer,
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      redirectUri: creds.redirectUri,
      sessionSecret
    });
  })();
  return oidcPromise;
};
