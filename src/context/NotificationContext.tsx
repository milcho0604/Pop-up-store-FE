'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { notificationApi } from '@/lib/notification';
import { fcmApi } from '@/lib/fcm';
import { getFirebaseMessaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

interface NotificationContextValue {
  unreadCount: number;
  refreshCount: () => Promise<void>;
  decrementCount: (n?: number) => void;
  resetCount: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  refreshCount: async () => {},
  decrementCount: () => {},
  resetCount: () => {},
});

async function initFcm(jwtToken: string, onMessage_cb: () => void) {
  try {
    if (!('Notification' in window) || !VAPID_KEY) return;

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return;

    const messaging = await getFirebaseMessaging();
    if (!messaging) return;

    // 서비스 워커 등록
    let swReg: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }

    const fcmToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (fcmToken) {
      await fcmApi.saveToken(jwtToken, fcmToken);
    }

    // 포그라운드 메시지 수신 (앱이 열려있을 때)
    onMessage(messaging, (payload) => {
      // 알림 뱃지 카운트 갱신
      onMessage_cb();

      // 브라우저 알림 표시 (포그라운드에서는 자동으로 안 뜨므로 직접 표시)
      if (payload.notification && Notification.permission === 'granted') {
        new Notification(payload.notification.title ?? '팝업스토어 알림', {
          body: payload.notification.body ?? '',
          icon: '/icon.svg',
        });
      }
    });
  } catch (err) {
    // 조용히 처리 (권한 거부, 미지원 환경 등)
    console.warn('FCM init failed:', err);
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTokenRef = useRef<string | null>(null);
  const fcmInitedRef = useRef(false);

  const refreshCount = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await notificationApi.getCount(token);
      setUnreadCount(res.result.unread);
    } catch {
      // 조용히 처리
    }
  }, []);

  const decrementCount = useCallback((n = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - n));
  }, []);

  const resetCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // 초기 로드 + 30초 폴링
  useEffect(() => {
    refreshCount();
    intervalRef.current = setInterval(refreshCount, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshCount]);

  // FCM 초기화 (최초 로드)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !fcmInitedRef.current) {
      prevTokenRef.current = token;
      fcmInitedRef.current = true;
      initFcm(token, refreshCount);
    }
  }, [refreshCount]);

  // 로그인/로그아웃 이벤트 감지
  useEffect(() => {
    const handler = async () => {
      const token = localStorage.getItem('token');

      // 로그아웃: 이전 토큰으로 FCM 삭제
      if (!token && prevTokenRef.current) {
        try {
          await fcmApi.logout(prevTokenRef.current);
        } catch {
          // 조용히 처리
        }
        fcmInitedRef.current = false;
      }

      // 로그인: FCM 초기화
      if (token && !fcmInitedRef.current) {
        fcmInitedRef.current = true;
        initFcm(token, refreshCount);
      }

      prevTokenRef.current = token;
      refreshCount();
    };

    window.addEventListener('auth-change', handler);
    return () => window.removeEventListener('auth-change', handler);
  }, [refreshCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshCount, decrementCount, resetCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
