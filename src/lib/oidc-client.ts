import { env } from "$env/dynamic/private";
import { createOidcClient } from "./oidc";

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

    // Registered by hand in auth under Admin / Clients — this app no longer registers itself.
    return createOidcClient({
      issuer,
      clientId: required("AUTH_CLIENT_ID"),
      clientSecret: required("AUTH_CLIENT_SECRET"),
      redirectUri,
      sessionSecret
    });
  })();
  return oidcPromise;
};
