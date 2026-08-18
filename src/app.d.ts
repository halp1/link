import type { JwtUser } from "$lib/jwt";

declare global {
  namespace App {
    interface Locals {
      user: JwtUser | null;
    }
    interface PageData {
      user: JwtUser | null;
    }
  }
}

export {};
