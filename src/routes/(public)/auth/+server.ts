import { redirect } from "@sveltejs/kit";
import { getOidc } from "$lib/oidc-client";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  if (event.locals.user) redirect(302, "/");
  const oidc = await getOidc();
  return oidc.startLogin(event);
};
