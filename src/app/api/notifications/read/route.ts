import { requireUser, json, errorResponse, ApiError, readJson, rateLimit } from "@/lib/db";
import { markRead, markAllRead } from "@/lib/notifications";
import { z } from "zod";

export const runtime = "nodejs";

const readSchema = z.object({
  id: z.string().uuid().optional(),
  all: z.boolean().optional(),
});

/** Marks a single notification (or all of them) as read. */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!rateLimit(`notification-read:${user.id}`, 120, 60)) {
      throw new ApiError(429, "Too many requests");
    }
    const body = readSchema.parse(await readJson<unknown>(req));

    if (body.all) {
      const count = await markAllRead(user.id);
      return json({ updated: count });
    }
    if (!body.id) {
      throw new ApiError(400, "Provide either id or all=true");
    }

    const updated = await markRead(user.id, body.id);
    return json({ updated: updated ? 1 : 0 });
  } catch (err) {
    return errorResponse(err);
  }
}