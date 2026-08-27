import type { RequestHandler } from "./$types";

export const POST: RequestHandler = () => new Response("ok", { status: 200 });
