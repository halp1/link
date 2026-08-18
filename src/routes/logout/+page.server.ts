import { redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";

export const actions: Actions = {
  default: async ({ cookies }) => {
    cookies.delete("token", { path: "/" });
    redirect(302, "/auth");
  }
};
