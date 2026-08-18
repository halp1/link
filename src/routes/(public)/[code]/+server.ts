import type { RequestHandler } from "./$types";
import { redirect } from "@sveltejs/kit";
import { statements } from "$lib/db";
import { isValidCode } from "$lib/short-code";
import { errorPageHtml, redirectPageHtml } from "$lib/redirect-html";
import type { StatusCode } from "$lib/db/types";

export const GET: RequestHandler = async ({ params, request, getClientAddress }) => {
  const { code } = params;
  if (!code || !isValidCode(code)) {
    return new Response(errorPageHtml("Not found", "This short link does not exist.", 404), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  const link = statements.getLinkByCode.get(code);
  if (!link) {
    return new Response(errorPageHtml("Not found", "This short link does not exist.", 404), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  const now = Math.floor(Date.now() / 1000);
  if (link.expires_at !== null && link.expires_at <= now) {
    return new Response(
      errorPageHtml("Link expired", "This short link has expired and is no longer available.", 410),
      {
        status: 410,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      }
    );
  }

  const ip = getClientAddress();
  const userAgent = request.headers.get("user-agent");
  const referer = request.headers.get("referer");

  statements.createHit.run(link.id, ip || null, userAgent, referer);
  statements.incrementHitCount.run(link.id);

  if (link.redirect_mode === "page") {
    return new Response(redirectPageHtml(link.destination_url), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  }

  redirect(link.status_code as StatusCode, link.destination_url);
};
