import { getOidc } from "$lib/oidc-client";
import type { Actions } from "./$types";

export const actions: Actions = {
  default: async (event) => {
    event.cookies.delete("token", { path: "/" });
    const oidc = await getOidc();
    await oidc.logout(event);
  }
};
