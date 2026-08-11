import { requireUser, pool, json, errorResponse, readJson, settingsSchema } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const { rows } = await pool.query(
      `SELECT * FROM user_settings WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );
    return json(rows[0] ?? null);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await readJson<Record<string, unknown>>(req);
    const input = settingsSchema.parse(body);

    const allowed = [
      "notifications_email",
      "notifications_push",
      "notifications_reminders",
      "theme",
      "language",
      "timezone",
      "week_starts_on",
    ];
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const key of allowed) {
      if (key in input) {
        values.push((input as Record<string, unknown>)[key]);
        sets.push(`"${key}" = $${values.length}`);
      }
    }
    if (sets.length === 0) throw new Error("No fields to update");

    values.push(user.id);
    const { rows } = await pool.query(
      `INSERT INTO user_settings (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    ).then(() =>
      pool.query(
        `UPDATE user_settings SET ${sets.join(", ")} WHERE user_id = $${values.length} RETURNING *`,
        values
      )
    );
    return json(rows[0]);
  } catch (err) {
    return errorResponse(err);
  }
}
