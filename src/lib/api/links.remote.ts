import { query, command, getRequestEvent } from "$app/server";
import { error } from "@sveltejs/kit";
import * as v from "valibot";
import { statements } from "$lib/db";
import type { RedirectMode, StatusCode } from "$lib/db/types";
import { generateShortCode, isUniqueConstraintError } from "$lib/short-code";
import { isValidDestinationUrl, maskIp } from "$lib/url";
import { expiryFromHours } from "$lib/utils";

const redirectModeSchema = v.picklist(["direct", "page"]);
const statusCodeSchema = v.picklist([301, 302, 307]);

export const getLinks = query(async () => {
  const { locals } = getRequestEvent();
  if (!locals.user) error(401, "Unauthorized");
  statements.deleteExpiredLinks.run();
  return { links: statements.getAllLinks.all() };
});

export const createLink = command(
  v.object({
    destination_url: v.string(),
    redirect_mode: v.optional(redirectModeSchema, "direct"),
    status_code: v.optional(statusCodeSchema, 302),
    expires_in_hours: v.optional(v.nullable(v.number()), null),
    show_ip: v.optional(v.boolean(), false)
  }),
  async ({ destination_url, redirect_mode, status_code, expires_in_hours, show_ip }) => {
    const { locals } = getRequestEvent();
    if (!locals.user) error(401, "Unauthorized");

    const trimmed = destination_url.trim();
    if (!isValidDestinationUrl(trimmed)) {
      error(400, "Destination must be a valid http or https URL");
    }

    const resolvedStatusCode = redirect_mode === "page" ? 302 : status_code;

    const expiresAt = expiryFromHours(expires_in_hours);
    const showIpInt = show_ip ? 1 : 0;

    for (let attempt = 0; attempt < 10; attempt++) {
      const code = generateShortCode();
      try {
        statements.createLink.run(
          code,
          trimmed,
          redirect_mode as RedirectMode,
          resolvedStatusCode as StatusCode,
          expiresAt,
          showIpInt
        );
        await getLinks().refresh();
        return { success: true, code, short_url: `/${code}`, expires_at: expiresAt };
      } catch (err) {
        if (!isUniqueConstraintError(err)) throw err;
      }
    }

    error(500, "Failed to generate a unique short code");
  }
);

export const deleteLink = command(v.object({ id: v.number() }), async ({ id }) => {
  const { locals } = getRequestEvent();
  if (!locals.user) error(401, "Unauthorized");
  const link = statements.getLinkById.get(id);
  if (!link) error(404, "Link not found");
  statements.deleteLink.run(id);
  await getLinks().refresh();
  return { success: true };
});

export const updateLink = command(
  v.object({
    id: v.number(),
    show_ip: v.optional(v.boolean()),
    expires_in_hours: v.optional(v.nullable(v.number()))
  }),
  async ({ id, show_ip, expires_in_hours }) => {
    const { locals } = getRequestEvent();
    if (!locals.user) error(401, "Unauthorized");
    const link = statements.getLinkById.get(id);
    if (!link) error(404, "Link not found");

    if (show_ip !== undefined) {
      statements.updateLinkShowIp.run(show_ip ? 1 : 0, id);
    }
    if (expires_in_hours !== undefined) {
      statements.updateLinkExpiresAt.run(expiryFromHours(expires_in_hours), id);
    }

    await getLinks().refresh();
    return { success: true };
  }
);

export const getLinkHits = query(
  v.object({
    link_id: v.number(),
    limit: v.optional(v.number(), 50),
    offset: v.optional(v.number(), 0)
  }),
  async ({ link_id, limit, offset }) => {
    const { locals } = getRequestEvent();
    if (!locals.user) error(401, "Unauthorized");

    const link = statements.getLinkById.get(link_id);
    if (!link) error(404, "Link not found");

    const hits = statements.getHitsForLink.all(link_id, limit, offset);
    const { count: total } = statements.countHitsForLink.get(link_id)!;

    return {
      link,
      hits: hits.map((hit) => ({
        ...hit,
        ip_address: link.show_ip ? hit.ip_address : maskIp(hit.ip_address)
      })),
      total
    };
  }
);
