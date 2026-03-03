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

  self.registration.showNotification(title, {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'popup-notification',
    renotify: true,
  });
});

// 알림 클릭 시 앱으로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
