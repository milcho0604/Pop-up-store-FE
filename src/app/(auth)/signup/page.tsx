'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { authApi } from '@/lib/auth';

type Step = 'email' | 'verify' | 'info';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Email step
  const [email, setEmail] = useState('');

  // Verify step
  const [code, setCode] = useState('');

  // Info step
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone] = useState('');

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('이메일을 입력해주세요.'); return; }

    setLoading(true);
    try {
      await authApi.sendVerificationCode(email);
      setStep('verify');
    } catch {
      setError('인증코드 전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code) { setError('인증코드를 입력해주세요.'); return; }

    setLoading(true);
    try {
      await authApi.verifyEmail(email, code);
      setStep('info');
    } catch {
      setError('인증코드가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !nickname || !password || !phone) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      await authApi.signup({
        name,
        nickname,
        memberEmail: email,
        password,
        phoneNumber: phone,
      });
      router.push('/login');
    } catch {
      setError('회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    email: '이메일 인증',
    verify: '인증코드 입력',
    info: '정보 입력',
  };

  const stepDescriptions = {
    email: '사용할 이메일을 입력해주세요',
    verify: `${email}로 전송된 인증코드를 입력해주세요`,
    info: '가입에 필요한 정보를 입력해주세요',
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-6">
      <div className="w-full max-w-sm mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center" />
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['email', 'verify', 'info'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  step === s
                    ? 'bg-gray-900 text-white'
                    : i < ['email', 'verify', 'info'].indexOf(step)
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900">{stepTitles[step]}</h1>
          <p className="text-sm text-gray-400 mt-1">{stepDescriptions[step]}</p>
        </div>

        {error && (
          <p className="text-xs text-red-500 text-center mb-4">{error}</p>
        )}

        {/* Step: Email */}
        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <Input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              인증코드 전송
            </Button>
          </form>
        )}

        {/* Step: Verify */}
        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              type="text"
              placeholder="인증코드 6자리"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              autoComplete="one-time-code"
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              확인
            </Button>
            <button
              type="button"
              onClick={handleSendCode}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              인증코드 재전송
            </button>
          </form>
        )}

        {/* Step: Info */}
        {step === 'info' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <Input
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <Input
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showPasswordToggle
              autoComplete="new-password"
            />
            <Input
              placeholder="비밀번호 확인"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              showPasswordToggle
              autoComplete="new-password"
            />
            <Input
              type="tel"
              placeholder="전화번호 (- 없이)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              가입하기
            </Button>
          </form>
        )}

        {/* Login Link */}
        <p className="mt-8 text-center text-sm text-gray-400">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-gray-900 font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
