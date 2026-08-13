import webpush from "web-push";

export interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

const vapidConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);

let configured = false;
export function configureVapid() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (publicKey && privateKey && subject) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
}

export async function sendPush(
  subscription: PushSubscriptionRow,
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<{ ok: boolean; statusCode?: number }> {
  if (!vapidConfigured()) return { ok: false };
  configureVapid();

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || "/app",
        tag: payload.tag || "productivity-hub",
      })
    );
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    // 404/410 means the subscription is gone (browser unsubscribed)
    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, statusCode };
    }
    return { ok: false, statusCode };
  }
}
