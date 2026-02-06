'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import LoginPrompt from '@/components/ui/LoginPrompt';

interface HeaderProps {
  className?: string;
}

export default function Header({ className = '' }: HeaderProps) {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

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
          </Link>
        </div>
      </header>
      <LoginPrompt open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
