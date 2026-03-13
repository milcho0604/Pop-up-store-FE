'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { PostDetailDto } from '@/types/post';
import { postApi } from '@/lib/post';
import { favoriteApi } from '@/lib/favorite';
import { isAdmin } from '@/lib/auth';
import StatusBadge from '@/components/ui/StatusBadge';
import DefaultImage from '@/components/ui/DefaultImage';
import CommentSection from '@/components/features/CommentSection';
import ReviewSection from '@/components/features/ReviewSection';
import LoginPrompt from '@/components/ui/LoginPrompt';
import ImageViewer from '@/components/ui/ImageViewer';
import PostInfoSection from './_components/PostInfoSection';
import { useToast } from '@/context/ToastContext';
import { loadKakaoShare, shareToKakao } from '@/lib/kakaoShare';

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export default function PopupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const postId = Number(id);
  const router = useRouter();
  const { showToast } = useToast();

  const [post, setPost] = useState<PostDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [shareSheet, setShareSheet] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 상세 조회
        const res = await postApi.getDetail(postId);
        const data = res.result;
        setPost(data);
        setLikeCount(data?.likeCount ?? 0);
        setLiked(data?.isLiked ?? false);

        // 조회수 증가 (별도 호출, 반환값은 조회수 숫자)
        postApi.incrementViews(postId).catch(() => {});

        // 로그인 상태면 좋아요/즐겨찾기 상태 확인
        const token = localStorage.getItem('token');
        if (token) {
          setAdmin(isAdmin(token));
          // 즐겨찾기 상태 확인
          try {
            const favRes = await favoriteApi.check(postId, token);
            setFavorited(favRes.result === true);
          } catch {
            setFavorited(false);
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
    if (!token) { setShowLogin(true); return; }

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
    if (!token) { setShowLogin(true); return; }

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

  const handleDelete = async () => {
    if (!confirm('팝업스토어를 삭제하시겠습니까?')) return;
    const token = getToken();
    if (!token) return;
    try {
      await postApi.delete(postId, token);
      router.replace('/');
    } catch {
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  const handleShare = () => setShareSheet(true);

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setShareSheet(false);
    showToast('링크가 복사되었습니다', 'success');
  };

  const handleKakaoShare = async () => {
    if (!post) return;
    try {
      await loadKakaoShare();
      shareToKakao(
        post.title,
        post.content?.slice(0, 100) ?? '',
        post.postImgUrl ?? null,
        window.location.href,
      );
      setShareSheet(false);
    } catch {
      showToast('카카오 공유를 불러올 수 없습니다.', 'error');
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: post?.title ?? '', url: window.location.href });
      setShareSheet(false);
    } catch {
      // 취소
    }
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
      <div
        className="relative aspect-[4/3] mx-5 rounded-2xl overflow-hidden"
        onClick={() => hasImage && setViewerOpen(true)}
      >
        {hasImage ? (
          <>
            <Image
              src={post.postImgUrl}
              alt={post.title}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 flex items-end justify-end p-3 pointer-events-none">
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/30 text-white text-[10px]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
                확대
              </span>
            </div>
          </>
        ) : (
          <DefaultImage className="w-full h-full" />
        )}
      </div>

      {/* 이미지 뷰어 */}
      {viewerOpen && hasImage && (
        <ImageViewer
          src={post.postImgUrl}
          alt={post.title}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* Content */}
      <div className="px-5 mt-5">
        {/* Title & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <StatusBadge status={post.status} className="mb-2" />
            <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
          </div>
          {admin && (
            <div className="flex gap-2 flex-shrink-0 mt-1">
              <button
                onClick={() => router.push(`/popup/edit/${postId}`)}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          )}
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
        <PostInfoSection post={post} startDate={startDate} endDate={endDate} address={address} />

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

        {/* Reviews */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <ReviewSection postId={postId} />
        </div>

        {/* Comments */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <CommentSection postId={postId} />
        </div>
      </div>

      <LoginPrompt open={showLogin} onClose={() => setShowLogin(false)} />

      {/* Share Sheet */}
      {shareSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShareSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-5 pt-5 pb-10 animate-slide-up">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className="text-sm font-semibold text-gray-900 mb-4">공유하기</p>
            <div className="flex gap-6">
              <button
                onClick={handleKakaoShare}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-yellow-400 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#3C1E1E">
                    <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.568 1.423 4.832 3.594 6.218L4.5 21l4.657-2.43C10.031 18.847 11 19 12 19c5.523 0 10-3.477 10-8.5S17.523 3 12 3z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-600">카카오톡</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <span className="text-xs text-gray-600">링크 복사</span>
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">더보기</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
