import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  channelDeliveryAllowed,
  isNotificationTypeEnabled,
  type NotificationChannels,
} from "./prefs-shared";

export * from "./prefs-shared";

export async function createUserNotificationIfEnabled(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
}): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { notificationCategoryPrefs: true },
  });
  if (!user || !isNotificationTypeEnabled(user.notificationCategoryPrefs, params.type)) {
    return false;
  }
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link ?? null,
    },
  });
  return true;
}

/** For email/SMS/push senders: category on + channel on + not in quiet hours. */
export async function userAllowsOutboundNotification(params: {
  userId: string;
  type: NotificationType;
  channel: keyof NotificationChannels;
  now?: Date;
}): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { notificationCategoryPrefs: true },
  });
  if (!user) return false;
  const raw = user.notificationCategoryPrefs;
  if (!isNotificationTypeEnabled(raw, params.type)) return false;
  return channelDeliveryAllowed(raw, params.channel, params.now ?? new Date());
}
