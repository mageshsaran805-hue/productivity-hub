import { requireUser, pool, json, errorResponse, ApiError, readJson, rateLimit } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!rateLimit(`push-subscribe:${user.id}`, 60, 60)) {
      throw new ApiError(429, "Too many requests");
    }
    const body = await readJson<Record<string, unknown>>(req);
    const input = subscriptionSchema.parse(body);

    const { rows } = await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, endpoint) DO UPDATE
         SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_agent = EXCLUDED.user_agent, updated_at = now()
       RETURNING id`,
      [user.id, input.endpoint, input.keys.p256dh, input.keys.auth, req.headers.get("user-agent")]
    );

    return json({ ok: true, id: rows[0].id }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");
    if (!endpoint) {
      throw new ApiError(400, "endpoint is required");
    }
    await pool.query("DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2", [user.id, endpoint]);
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
