'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { postApi } from '@/lib/post';
import { isAdmin } from '@/lib/auth';
import { memberApi } from '@/lib/member';
import LoginPrompt from '@/components/ui/LoginPrompt';

const categories = [
  { value: 'FASHION', label: '패션' },
  { value: 'BEAUTY', label: '뷰티' },
  { value: 'FOOD', label: '푸드' },
  { value: 'ART', label: '아트/전시' },
  { value: 'CHARACTER', label: '캐릭터' },
  { value: 'LIFESTYLE', label: '라이프스타일' },
  { value: 'SPORTS', label: '스포츠' },
  { value: 'TECH', label: '테크/IT' },
  { value: 'CULTURE', label: '문화/공연' },
  { value: 'ETC', label: '기타' },
];

export default function PopupCreatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [memberEmail, setMemberEmail] = useState('');

  // 폼 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [city, setCity] = useState('');
  const [dong, setDong] = useState('');
  const [street, setStreet] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [postImage, setPostImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setShowLogin(true);
      setLoading(false);
      return;
    }

    if (!isAdmin(token)) {
      router.replace('/');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await memberApi.getProfile(token);
        setMemberEmail(res.result.memberEmail);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPostImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags([...tags, trimmed]);
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('제목을 입력해주세요.'); return; }
    if (!content.trim()) { setError('내용을 입력해주세요.'); return; }
    if (!startDate || !endDate) { setError('시작일과 종료일을 입력해주세요.'); return; }

    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      await postApi.create(
        token,
        {
          memberEmail,
          title: title.trim(),
          content: content.trim(),
          startDate: `${startDate} 00:00:00`,
          endDate: `${endDate} 23:59:59`,
          city: city || undefined,
          dong: dong || undefined,
          street: street || undefined,
          zipcode: zipcode || undefined,
          detailAddress: detailAddress || undefined,
          category: category || undefined,
          tagNames: tags.length > 0 ? tags : undefined,
        },
        postImage ?? undefined,
      );
      router.push('/');
    } catch {
      setError('팝업 등록에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200';

  return (
    <>
      <div className="px-5 pt-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">팝업스토어 등록</h1>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            취소
          </button>
        </div>

        {loading && (
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-gray-100 rounded-2xl" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/4" />
                <div className="h-10 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && memberEmail && (
          <form onSubmit={handleSubmit}>
            {/* 이미지 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full h-48 rounded-2xl overflow-hidden bg-gray-50 group mb-6"
            >
              {previewUrl ? (
                <Image src={previewUrl} alt="미리보기" fill className="object-cover" sizes="100vw" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="text-xs mt-2">이미지를 선택하세요</span>
                </div>
              )}
              {previewUrl && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            <div className="space-y-5">
              {/* 제목 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">제목 *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="팝업스토어 이름" className={inputClass} />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">내용 *</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="팝업스토어 소개" rows={4} className={`${inputClass} resize-none`} />
              </div>

              {/* 기간 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">시작일 *</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">종료일 *</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
                </div>
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">카테고리</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                  <option value="">선택하세요</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">태그</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="태그 입력 후 Enter"
                    className={`${inputClass} flex-1`}
                  />
                  <button type="button" onClick={handleAddTag} className="px-4 py-3 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-800 transition-colors">
                    추가
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                        #{tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="text-gray-400 hover:text-gray-600">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 주소 */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-4">위치 정보</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">시/도</label>
                      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="서울" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">동</label>
                      <input type="text" value={dong} onChange={(e) => setDong(e.target.value)} placeholder="성수동" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">도로명 주소</label>
                    <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="성수이로 100" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">우편번호</label>
                      <input type="text" value={zipcode} onChange={(e) => setZipcode(e.target.value)} placeholder="04790" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">상세주소</label>
                      <input type="text" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} placeholder="1층" className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mt-4">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full mt-8 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
            >
              {saving ? '등록 중...' : '등록하기'}
            </button>
          </form>
        )}
      </div>

      <LoginPrompt open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
