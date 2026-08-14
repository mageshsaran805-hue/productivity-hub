import { requireUser, pool, json, errorResponse, ApiError, rateLimit } from "@/lib/db";
import { sendPush, type PushSubscriptionRow } from "@/lib/push";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

/**
 * Sends a test notification: writes a system notification row and fires a
 * push to every subscribed device. Used from Settings to verify push works.
 */
export async function POST() {
  try {
    const user = await requireUser();
    if (!rateLimit(`notification-test:${user.id}`, 5, 60)) {
      throw new ApiError(429, "Too many requests");
    }

    await createNotification(user.id, {
      type: "system",
      title: "Test notification",
      message: "Push notifications are working. Great job!",
      data: { test: true },
      dedupKey: `test:${Date.now()}`,
    });

    const { rows: subscriptions } = await pool.query<PushSubscriptionRow>(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
      [user.id]
    );

    let sent = 0;
    for (const sub of subscriptions) {
      const res = await sendPush(sub, {
        title: "Test notification",
        body: "Push notifications are working. Great job!",
        url: "/app/notifications",
        tag: "test-notification",
      });
      if (res.ok) sent++;
    }

    return json({ sent, subscribed: subscriptions.length });
  } catch (err) {
    return errorResponse(err);
  }
}