'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { memberApi } from '@/lib/member';
import { MemberProfileResDto, MemberProfileUpdateReqDto } from '@/types/member';
import LoginPrompt from '@/components/ui/LoginPrompt';

export default function ProfileEditPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<MemberProfileResDto | null>(null);
  const [imgError, setImgError] = useState(false);

  // 폼 상태
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setShowLogin(true);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await memberApi.getProfile(token);
        const p = res.result;
        setProfile(p);
        setNickname(p.nickname ?? '');
        setName(p.name ?? '');
        setPhoneNumber(p.phoneNumber ?? '');
      } catch {
        // 에러 시 조용히 처리
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password && password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const data: MemberProfileUpdateReqDto = {};
      if (nickname !== profile?.nickname) data.nickname = nickname;
      if (name !== profile?.name) data.name = name;
      if (phoneNumber !== profile?.phoneNumber) data.phoneNumber = phoneNumber;
      if (password) {
        data.password = password;
        data.confirmPassword = confirmPassword;
      }

      await memberApi.updateProfile(token, data, profileImage ?? undefined);
      router.push('/mypage');
    } catch {
      setError('프로필 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const currentImgUrl = previewUrl ?? (profile?.profileImgUrl && !imgError ? profile.profileImgUrl : null);

  return (
    <>
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">프로필 수정</h1>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            취소
          </button>
        </div>

        {loading && (
          <div className="animate-pulse space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gray-100" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/4" />
                <div className="h-10 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && profile && (
          <form onSubmit={handleSubmit}>
            {/* 프로필 이미지 */}
            <div className="flex justify-center mb-8">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 group"
              >
                {currentImgUrl ? (
                  <Image
                    src={currentImgUrl}
                    alt="프로필"
                    fill
                    className="object-cover"
                    onError={() => setImgError(true)}
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                {/* 카메라 오버레이 */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* 입력 필드 */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">닉네임</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">전화번호</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-4">비밀번호 변경 (선택)</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">새 비밀번호</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="변경할 비밀번호를 입력하세요"
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">비밀번호 확인</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="비밀번호를 다시 입력하세요"
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <p className="text-xs text-red-500 mt-4">{error}</p>
            )}

            {/* 저장 버튼 */}
            <button
              type="submit"
              disabled={saving}
              className="w-full mt-8 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </form>
        )}
      </div>

      <LoginPrompt open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
