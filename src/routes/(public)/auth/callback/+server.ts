import { getOidc } from "$lib/oidc-client";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  const oidc = await getOidc();
  return oidc.handleCallback(event);
};
