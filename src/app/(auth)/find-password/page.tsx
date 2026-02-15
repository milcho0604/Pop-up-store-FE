'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { authApi } from '@/lib/auth';

export default function FindPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await authApi.findPassword(email.trim());
      setSent(true);
    } catch {
      setError('해당 이메일로 가입된 계정을 찾을 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-6">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-10">
          <Logo size="lg" className="justify-center" />
        </div>

        {sent ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">이메일을 확인해주세요</h2>
            <p className="text-sm text-gray-400 mb-2">
              <span className="text-gray-600 font-medium">{email}</span>으로
            </p>
            <p className="text-sm text-gray-400 mb-8">
              비밀번호 재설정 링크를 보냈습니다.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-3.5 bg-gray-900 text-white text-base font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">비밀번호 찾기</h2>
            <p className="text-sm text-gray-400 text-center mb-8">
              가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              {error && (
                <p className="text-xs text-red-500 text-center">{error}</p>
              )}

              <Button type="submit" fullWidth size="lg" loading={loading}>
                재설정 링크 보내기
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              <Link href="/login" className="text-gray-900 font-medium hover:underline">
                로그인으로 돌아가기
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
