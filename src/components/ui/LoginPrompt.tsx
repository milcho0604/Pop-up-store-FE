'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface LoginPromptProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginPrompt({ open, onClose }: LoginPromptProps) {
  const router = useRouter();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleLogin = () => {
    onClose();
    router.push('/login');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl px-6 py-7 mx-6 w-full max-w-xs shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900">로그인이 필요해요</h3>
          <p className="text-sm text-gray-400 mt-1">로그인 후 이용할 수 있습니다</p>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 transition-colors hover:bg-gray-200"
          >
            취소
          </button>
          <button
            onClick={handleLogin}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-gray-900 transition-colors hover:bg-gray-800"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}
