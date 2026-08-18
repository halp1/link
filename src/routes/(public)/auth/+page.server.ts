import { redirect } from "@sveltejs/kit";
import { statements } from "$lib/db";
import bcrypt from "bcryptjs";
import { jwt } from "$lib/jwt";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(302, "/");
  const { count } = statements.getUserCount.get()!;
  return { isFirstUser: count === 0, user: null };
};

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = (data.get("username") as string)?.trim();
    const password = data.get("password") as string;

    if (!username || !password) {
      return {
        success: false,
        message: "Username and password are required.",
        username: username ?? ""
      };
    }

    const user = statements.getUserByUsername.get(username);
    if (!user) {
      return { success: false, message: "Invalid username or password.", username };
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return { success: false, message: "Invalid username or password.", username };
    }

    cookies.set("token", jwt.sign({ username }), { httpOnly: true, path: "/", sameSite: "lax" });
    redirect(302, "/");
  },

  register: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = (data.get("username") as string)?.trim();
    const password = data.get("password") as string;
    const confirmPassword = data.get("confirmPassword") as string;

    if (!username || !password || !confirmPassword) {
      return { success: false, message: "All fields are required.", username: username ?? "" };
    }
    if (password !== confirmPassword) {
      return { success: false, message: "Passwords do not match.", username };
    }

    const { count } = statements.getUserCount.get()!;
    if (count > 0) {
      return { success: false, message: "Registration is closed.", username };
    }

    const hash = await bcrypt.hash(password, 12);
    statements.createUser.run(username, hash);

    cookies.set("token", jwt.sign({ username }), { httpOnly: true, path: "/", sameSite: "lax" });
    redirect(302, "/");
  }
};
