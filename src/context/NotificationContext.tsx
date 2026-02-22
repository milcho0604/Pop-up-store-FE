'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { notificationApi } from '@/lib/notification';

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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // 로그인/로그아웃 이벤트 감지
  useEffect(() => {
    const handler = () => refreshCount();
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
