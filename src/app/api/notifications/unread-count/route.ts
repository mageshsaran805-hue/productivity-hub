import { requireUser, json, errorResponse } from "@/lib/db";
import { countUnread } from "@/lib/notifications";

export const runtime = "nodejs";

/** Count of unread notification rows. Powers the bell badge in the top nav. */
export async function GET() {
  try {
    const user = await requireUser();
    const count = await countUnread(user.id);
    return json({ count });
  } catch (err) {
    return errorResponse(err);
  }
}