'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { PostDetailDto } from '@/types/post';
import { postApi } from '@/lib/post';
import { favoriteApi } from '@/lib/favorite';
import StatusBadge from '@/components/ui/StatusBadge';
import DefaultImage from '@/components/ui/DefaultImage';
import CommentSection from '@/components/features/CommentSection';

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수',
  THURSDAY: '목', FRIDAY: '금', SATURDAY: '토', SUNDAY: '일',
  Monday: '월', Tuesday: '화', Wednesday: '수',
  Thursday: '목', Friday: '금', Saturday: '토', Sunday: '일',
  monday: '월', tuesday: '화', wednesday: '수',
  thursday: '목', friday: '금', saturday: '토', sunday: '일',
  월: '월', 화: '화', 수: '수', 목: '목', 금: '금', 토: '토', 일: '일',
};

export default function PopupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const postId = Number(id);
  const router = useRouter();

  const [post, setPost] = useState<PostDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 상세 조회
        const res = await postApi.getDetail(postId);
        const data = res.result;
        setPost(data);
        setLikeCount(data?.likeCount ?? 0);

        // 조회수 증가 (별도 호출, 반환값은 조회수 숫자)
        postApi.incrementViews(postId).catch(() => {});

        // 로그인 상태면 좋아요/즐겨찾기 상태 확인
        const token = localStorage.getItem('token');
        if (token) {
          // 즐겨찾기 상태 확인
          try {
            const favRes = await favoriteApi.check(postId, token);
            setFavorited(favRes.result === true);
          } catch {
            setFavorited(false);
          }

          // 좋아요 상태: getLikes로 현재 수를 가져오고,
          // like 시도 → 반환된 수가 같으면 이미 좋아요 (idempotent), 다르면 새로 추가된 것이니 취소
          try {
            const beforeRes = await postApi.getLikes(postId);
            const beforeCount = beforeRes.result ?? 0;

            const afterRes = await postApi.like(postId, token);
            const afterCount = afterRes.result ?? 0;

            if (afterCount > beforeCount) {
              // 새로 좋아요가 추가됨 → 원래 안 눌렀던 상태 → unlike로 원복
              await postApi.unlike(postId, token);
              setLiked(false);
              setLikeCount(beforeCount);
            } else {
              // 수가 같음 → 이미 좋아요 상태 (idempotent)
              setLiked(true);
              setLikeCount(afterCount);
            }
          } catch {
            // 에러 시 기본값 유지
          }
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [postId]);

  const getToken = () => localStorage.getItem('token');

  const handleLike = async () => {
    const token = getToken();
    if (!token) { alert('로그인이 필요합니다.'); return; }

    try {
      if (liked) {
        const res = await postApi.unlike(postId, token);
        setLikeCount(res.result ?? likeCount - 1);
        setLiked(false);
      } else {
        const res = await postApi.like(postId, token);
        setLikeCount(res.result ?? likeCount + 1);
        setLiked(true);
      }
    } catch {
      /* ignore */
    }
  };

  const handleFavorite = async () => {
    const token = getToken();
    if (!token) { alert('로그인이 필요합니다.'); return; }

    try {
      if (favorited) {
        await favoriteApi.remove(postId, token);
        setFavorited(false);
      } else {
        await favoriteApi.add(postId, token);
        setFavorited(true);
      }
    } catch {
      // 이미 추가/삭제된 상태면 에러 → 상태 반전해서 보정
      setFavorited(!favorited);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: post?.title ?? '', url });
        return;
      }
    } catch {
      // share dialog cancelled
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

  if (loading) {
    return (
      <div className="px-5 pt-2 animate-pulse">
        <div className="h-6 w-6 rounded mb-4" />
        <div className="aspect-[4/3] rounded-2xl bg-gray-100 mb-5" />
        <div className="h-5 bg-gray-100 rounded w-3/4 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-6" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded" />
          <div className="h-3 bg-gray-100 rounded" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-5">
        <p className="text-sm text-gray-400 mb-3">팝업스토어를 찾을 수 없습니다</p>
        <button onClick={() => router.back()} className="text-sm font-medium text-gray-900 hover:underline">
          뒤로가기
        </button>
      </div>
    );
  }

  const hasImage = post.postImgUrl && !imgError;
  const address = [post.city, post.dong, post.street, post.detailAddress].filter(Boolean).join(' ');
  const startDate = formatDate(post.startDate);
  const endDate = formatDate(post.endDate);

  return (
    <div className="pb-8">
      {/* Back Button */}
      <div className="px-5 py-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Image */}
      <div className="relative aspect-[4/3] mx-5 rounded-2xl overflow-hidden">
        {hasImage ? (
          <Image
            src={post.postImgUrl}
            alt={post.title}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            sizes="100vw"
            priority
          />
        ) : (
          <DefaultImage className="w-full h-full" />
        )}
      </div>

      {/* Content */}
      <div className="px-5 mt-5">
        {/* Title & Status */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <StatusBadge status={post.status} className="mb-2" />
            <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.map((tag) => (
              <span key={tag.id} className="px-2.5 py-1 bg-gray-50 rounded-full text-xs text-gray-500">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-5 py-4 border-y border-gray-100">
          <button onClick={handleLike} className="flex items-center gap-1.5 text-sm transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? '#ef4444' : 'none'} stroke={liked ? '#ef4444' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className={liked ? 'text-red-500 font-medium' : 'text-gray-400'}>{likeCount}</span>
          </button>

          <button onClick={handleFavorite} className="flex items-center gap-1.5 text-sm transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill={favorited ? '#111827' : 'none'} stroke={favorited ? '#111827' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span className={favorited ? 'text-gray-900 font-medium' : 'text-gray-400'}>저장</span>
          </button>

          <button onClick={handleShare} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors ml-auto">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            공유
          </button>

          <div className="flex items-center gap-1 text-xs text-gray-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {post.viewCount ?? 0}
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-5 space-y-4">
          {/* Period */}
          {(startDate || endDate) && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400">기간</p>
                <p className="text-sm text-gray-900 font-medium">
                  {startDate && endDate
                    ? `${startDate} ~ ${endDate}`
                    : startDate || endDate}
                </p>
              </div>
            </div>
          )}

          {/* Location */}
          {address && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400">위치</p>
                <p className="text-sm text-gray-900 font-medium">{address}</p>
              </div>
            </div>
          )}

          {/* Operating Hours */}
          {post.businessInfo?.operatingHours && Object.keys(post.businessInfo.operatingHours).length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400">운영시간</p>
                <div className="mt-1 space-y-0.5">
                  {Object.entries(post.businessInfo.operatingHours).map(([day, hours]) => {
                    const label = DAY_LABELS[day] ?? day.slice(0, 2);
                    return (
                      <div key={day} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400 w-6">{label}</span>
                        {hours.closed ? (
                          <span className="text-gray-300">휴무</span>
                        ) : (
                          <span className="text-gray-900">
                            {hours.open ?? '-'} - {hours.close ?? '-'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Entry Fee */}
          {post.businessInfo?.entryFee && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400">입장료</p>
                <p className="text-sm text-gray-900 font-medium">{post.businessInfo.entryFee}</p>
              </div>
            </div>
          )}

          {/* Subway */}
          {post.businessInfo?.nearbySubway && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="3" width="16" height="14" rx="2" />
                  <line x1="4" y1="11" x2="20" y2="11" />
                  <line x1="9" y1="21" x2="6" y2="17" />
                  <line x1="15" y1="21" x2="18" y2="17" />
                  <circle cx="9" cy="14" r="1" fill="#9ca3af" />
                  <circle cx="15" cy="14" r="1" fill="#9ca3af" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400">가까운 지하철</p>
                <p className="text-sm text-gray-900 font-medium">
                  {post.businessInfo.nearbySubway}
                  {post.businessInfo.nearbySubwayExit && ` ${post.businessInfo.nearbySubwayExit}`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {post.content && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-3">소개</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {post.content}
            </p>
          </div>
        )}

        {/* Author */}
        {post.nickname && (
          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {post.profileImgUrl ? (
                <img src={post.profileImgUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                  {post.nickname.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{post.nickname}</p>
              <p className="text-xs text-gray-400">{formatDate(post.createdTimeAt)} 작성</p>
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <CommentSection postId={postId} />
        </div>
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg animate-fade-in z-50">
          링크가 복사되었습니다
        </div>
      )}
    </div>
  );
}
