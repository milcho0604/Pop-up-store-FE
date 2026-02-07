'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import LoginPrompt from '@/components/ui/LoginPrompt';
import { notificationApi } from '@/lib/notification';

interface HeaderProps {
  className?: string;
}

export default function Header({ className = '' }: HeaderProps) {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchCount = async () => {
      try {
        const res = await notificationApi.getCount(token);
        setUnreadCount(res.result.unread);
      } catch {
        // 조용히 처리
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotification = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setShowLogin(true);
      return;
    }
    router.push('/notifications');
  };

  return (
    <>
      <header className={`sticky top-0 z-40 bg-white/80 backdrop-blur-lg ${className}`}>
        <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-5">
          <Logo size="sm" />
          <Link href="/notifications" onClick={handleNotification} className="relative text-gray-400 hover:text-gray-900 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </header>
      <LoginPrompt open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
