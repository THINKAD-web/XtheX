/** IndexedDB 캐시 키 (동일 출처·브라우저 프로필 기준) */
export const OFFLINE_CACHE = {
  notifications: "api:/api/notifications",
  dashboardStats: (role: "ADVERTISER" | "MEDIA_OWNER") =>
    `api:/api/dashboard/stats:${role}`,
  notificationHistory: (queryString: string) =>
    `api:/api/notifications/history:${queryString}`,
} as const;

export const OFFLINE_SYNC_EVENT = "xthex-offline-sync";
