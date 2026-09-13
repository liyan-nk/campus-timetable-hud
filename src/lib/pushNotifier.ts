import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

let isVapidConfigured = false;

function ensureVapidConfig() {
  if (isVapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@campus-timetable-hud.vercel.app';

  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    isVapidConfigured = true;
  }
}

export async function sendBroadcastNotification(title: string, message: string, url = '/') {
  ensureVapidConfig();

  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) {
    return { success: true, sent: 0, total: 0, cleanedUp: 0 };
  }

  const payload = JSON.stringify({
    title,
    body: message,
    url,
  });

  let sent = 0;
  let cleanedUp = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, payload);
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.deleteMany({
            where: { endpoint: sub.endpoint },
          });
          cleanedUp++;
        } else {
          console.warn('Failed to send push notification to endpoint:', sub.endpoint, err);
        }
      }
    })
  );

  return { success: true, sent, total: subscriptions.length, cleanedUp };
}
