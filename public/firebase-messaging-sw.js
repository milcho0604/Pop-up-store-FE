// Firebase Messaging Service Worker
// 백그라운드 알림 처리 (앱이 닫혀있거나 백그라운드일 때)
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD_j25xSVIkvK1ki9tOuGdCwOJiOxH6uzg",
  authDomain: "milcho-612c1.firebaseapp.com",
  projectId: "milcho-612c1",
  storageBucket: "milcho-612c1.firebasestorage.app",
  messagingSenderId: "769361859691",
  appId: "1:769361859691:web:735c782836b1b90f400d2e",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? '팝업스토어 알림';
  const body = payload.notification?.body ?? '';
  // FCM data 필드에서 딥링크 URL 추출 (없으면 알림 목록으로)
  const url = payload.data?.url || '/notifications';

  self.registration.showNotification(title, {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'popup-notification',
    renotify: true,
    data: { url },
  });
});

// 알림 클릭 시 딥링크 페이지로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 탭이 있으면 포커스 후 해당 URL로 이동
      for (const client of clientList) {
        if ('navigate' in client && 'focus' in client) {
          return client.focus().then(() => client.navigate(url));
        }
      }
      // 열린 탭이 없으면 새 탭 열기
      return clients.openWindow(url);
    })
  );
});
