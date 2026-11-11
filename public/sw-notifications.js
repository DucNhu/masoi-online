// =====================================================================
// Ma Sói Online & Offline — Service Worker Notification & Push Handler
// Xử lý thông báo trình duyệt nhắc hẹn chơi ma sói trước 15 phút.
// =====================================================================

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const matchData = event.notification.data || {};
  const targetUrl = matchData.url || self.registration.scope || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Nếu đã có tab game đang mở: focus vào tab đó
      for (const client of windowClients) {
        if ('focus' in client) {
          if (matchData.roomId && 'postMessage' in client) {
            client.postMessage({
              type: 'NAVIGATE_TO_SCHEDULED_MATCH',
              matchId: matchData.matchId,
              tableName: matchData.tableName,
            });
          }
          return client.focus();
        }
      }
      // 2. Nếu chưa mở tab nào: mở cửa sổ mới
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: '🐺 Làng Ma Sói đang gọi!', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || '🐺 Sắp Đến Giờ Hẹn Ma Sói! (Còn 15 phút)';
  const options = {
    body: payload.body || 'Ván đấu cùng bạn bè sắp bắt đầu. Mau vào lều chuẩn bị nhé!',
    icon: payload.icon || '/favicon.svg',
    badge: payload.badge || '/favicon.svg',
    vibrate: [200, 100, 200],
    tag: payload.tag || 'masoi-match-reminder',
    renotify: true,
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
