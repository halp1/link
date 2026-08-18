import { error } from "@sveltejs/kit";
import { statements } from "$lib/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) error(404, "Link not found");

  const link = statements.getLinkById.get(id);
  if (!link) error(404, "Link not found");

  return { link };
};
