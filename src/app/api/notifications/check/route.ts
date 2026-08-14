import { requireUser, json, errorResponse, ApiError, rateLimit } from "@/lib/db";
import { generateDueNotifications } from "@/lib/notifications";

export const runtime = "nodejs";

/**
 * Client-side scheduler entry point. The app polls this while open so
 * per-task lead-time reminders and habit reminders fire at their scheduled
 * time instead of waiting for the once-a-day cron.
 *
 * Returns the notifications that were newly created this scan, so the client
 * can surface them immediately (toast / browser notification / badge).
 */
export async function POST() {
  try {
    const user = await requireUser();
    if (!rateLimit(`notification-check:${user.id}`, 30, 60)) {
      throw new ApiError(429, "Too many requests");
    }

    const created = await generateDueNotifications(user.id);
    return json({ created });
  } catch (err) {
    return errorResponse(err);
  }
}