import { requireUser, pool, json, errorResponse, ApiError, readJson, calendarEventCreateSchema, rateLimit, requireUuid } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

async function getOwnedEvent(userId: string, eventId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM calendar_events WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [eventId, userId]
  );
  if (rows.length === 0) throw new ApiError(404, "Event not found");
  return rows[0];
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = requireUuid((await params).id);
    const event = await getOwnedEvent(user.id, id);
    return json(event);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    if (!rateLimit(`calendar-event-update:${user.id}`, 120, 60)) {
      throw new ApiError(429, "Too many requests");
    }
    const id = requireUuid((await params).id);
    await getOwnedEvent(user.id, id);

    const body = await readJson<Record<string, unknown>>(req);
    const input = calendarEventCreateSchema.partial().parse(body);

    const allowed = ["title", "description", "start_date", "end_date", "is_all_day", "color"];
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const key of allowed) {
      if (key in input) {
        values.push((input as Record<string, unknown>)[key] ?? null);
        sets.push(`"${key}" = $${values.length}`);
      }
    }
    if (sets.length === 0) throw new ApiError(400, "No fields to update");

    values.push(user.id, id);
    const { rows } = await pool.query(
      `UPDATE calendar_events SET ${sets.join(", ")} WHERE user_id = $${values.length - 1} AND id = $${values.length} RETURNING *`,
      values
    );
    return json(rows[0]);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = requireUuid((await params).id);
    const result = await pool.query(
      `DELETE FROM calendar_events WHERE user_id = $1 AND id = $2 RETURNING id`,
      [user.id, id]
    );
    if (result.rowCount === 0) throw new ApiError(404, "Event not found");
    return json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}