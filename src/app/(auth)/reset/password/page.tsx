'use client';

import { FormEvent, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { authApi } from '@/lib/auth';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">유효하지 않은 링크</h2>
        <p className="text-sm text-gray-400 mb-8">
          비밀번호 재설정 링크가 만료되었거나 올바르지 않습니다.
        </p>
        <Link
          href="/find-password"
          className="inline-flex items-center justify-center w-full py-3.5 bg-gray-900 text-white text-base font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          다시 요청하기
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, newPassword, confirmPassword);
      setDone(true);
    } catch {
      setError('비밀번호 재설정에 실패했습니다. 링크가 만료되었을 수 있습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">비밀번호가 변경되었습니다</h2>
        <p className="text-sm text-gray-400 mb-8">
          새로운 비밀번호로 로그인해주세요.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full py-3.5 bg-gray-900 text-white text-base font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-lg font-bold text-gray-900 text-center mb-2">비밀번호 재설정</h2>
      <p className="text-sm text-gray-400 text-center mb-8">
        새로운 비밀번호를 입력해주세요.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="새 비밀번호"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          showPasswordToggle
          autoComplete="new-password"
        />
        <Input
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          showPasswordToggle
          autoComplete="new-password"
        />

        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}

        <Button type="submit" fullWidth size="lg" loading={loading}>
          비밀번호 변경
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        <Link href="/login" className="text-gray-900 font-medium hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-6">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-10">
          <Logo size="lg" className="justify-center" />
        </div>

        <Suspense fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-100 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto" />
            <div className="h-12 bg-gray-100 rounded" />
            <div className="h-12 bg-gray-100 rounded" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
