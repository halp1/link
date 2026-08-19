import { getOidc } from "$lib/oidc-client";
import { building } from "$app/environment";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  if (building) {
    event.locals.user = null;
    return resolve(event);
  }
  const oidc = await getOidc();
  event.locals.user = oidc.readSession(event);
  if (!event.locals.user) {
    event.cookies.delete("token", { path: "/" });
  }
  return resolve(event);
};
