'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import Image from 'next/image';
import { ReviewResDto, ReviewCreateReqDto } from '@/types/review';
import { reviewApi } from '@/lib/review';
import LoginPrompt from '@/components/ui/LoginPrompt';

interface ReviewSectionProps {
  postId: number;
}

function timeAgo(dateStr: string) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

const ratingLabels = [
  { key: 'satisfaction' as const, label: '만족도' },
  { key: 'waitingTime' as const, label: '대기시간' },
  { key: 'photoAvailability' as const, label: '포토존' },
];

function StarRating({
  value,
  onChange,
  size = 16,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={`${onChange ? 'cursor-pointer' : 'cursor-default'} transition-colors`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={star <= value ? '#FBBF24' : 'none'}
            stroke={star <= value ? '#FBBF24' : '#D1D5DB'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ postId }: ReviewSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reviews, setReviews] = useState<ReviewResDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 폼 상태
  const [content, setContent] = useState('');
  const [satisfaction, setSatisfaction] = useState(0);
  const [waitingTime, setWaitingTime] = useState(0);
  const [photoAvailability, setPhotoAvailability] = useState(0);
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await reviewApi.getList(postId);
      setReviews(res.result ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const resetForm = () => {
    setContent('');
    setSatisfaction(0);
    setWaitingTime(0);
    setPhotoAvailability(0);
    setReviewImage(null);
    setPreviewUrl(null);
    setShowForm(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReviewImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      setShowLogin(true);
      return;
    }

    if (!satisfaction || !waitingTime || !photoAvailability) {
      alert('별점을 모두 선택해주세요.');
      return;
    }
    if (!content.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const data: ReviewCreateReqDto = {
        content: content.trim(),
        satisfaction,
        waitingTime,
        photoAvailability,
      };
      await reviewApi.create(postId, data, token, reviewImage ?? undefined);
      resetForm();
      await fetchReviews();
    } catch {
      alert('리뷰 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await reviewApi.delete(reviewId, token);
      await fetchReviews();
    } catch {
      alert('리뷰 삭제에 실패했습니다.');
    }
  };

  const handleToggleForm = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setShowLogin(true);
      return;
    }
    setShowForm(!showForm);
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          리뷰 {reviews.length > 0 && <span className="text-gray-400">{reviews.length}</span>}
          {avgRating && (
            <span className="ml-2 text-sm font-normal text-yellow-500">
              ★ {avgRating}
            </span>
          )}
        </h3>
        <button
          onClick={handleToggleForm}
          className="text-xs font-medium text-gray-900 hover:text-gray-600 transition-colors"
        >
          {showForm ? '취소' : '리뷰 작성'}
        </button>
      </div>

      {/* 리뷰 작성 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-2xl space-y-4">
          {/* 별점 3종 */}
          <div className="space-y-3">
            {ratingLabels.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{label}</span>
                <StarRating
                  value={key === 'satisfaction' ? satisfaction : key === 'waitingTime' ? waitingTime : photoAvailability}
                  onChange={(v) => {
                    if (key === 'satisfaction') setSatisfaction(v);
                    else if (key === 'waitingTime') setWaitingTime(v);
                    else setPhotoAvailability(v);
                  }}
                />
              </div>
            ))}
          </div>

          {/* 내용 */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="리뷰를 작성해주세요"
            rows={3}
            className="w-full px-4 py-3 bg-white rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
          />

          {/* 이미지 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl text-xs text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              사진 첨부
            </button>
            {previewUrl && (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                <Image src={previewUrl} alt="미리보기" fill className="object-cover" sizes="48px" />
                <button
                  type="button"
                  onClick={() => { setReviewImage(null); setPreviewUrl(null); }}
                  className="absolute top-0 right-0 bg-black/50 rounded-bl-lg p-0.5"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </div>

          {/* 등록 버튼 */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
          >
            {submitting ? '등록 중...' : '리뷰 등록'}
          </button>
        </form>
      )}

      {/* 리뷰 목록 */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-20" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          아직 리뷰가 없습니다. 첫 리뷰를 남겨보세요!
        </p>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => (
            <ReviewItem key={review.reviewId} review={review} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <LoginPrompt open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}

function ReviewItem({
  review,
  onDelete,
}: {
  review: ReviewResDto;
  onDelete: (id: number) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex gap-3">
      {/* 프로필 */}
      <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
        {review.memberProfileImg ? (
          <img src={review.memberProfileImg} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-medium">
            {review.memberNickname?.charAt(0) ?? '?'}
          </div>
        )}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{review.memberNickname}</span>
          <span className="text-xs text-gray-300">{timeAgo(review.createdAt)}</span>
        </div>

        {/* 별점 */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-yellow-500 font-medium">★ {review.rating.toFixed(1)}</span>
          <span className="text-[10px] text-gray-300">
            만족 {review.satisfaction} · 대기 {review.waitingTime} · 포토 {review.photoAvailability}
          </span>
        </div>

        <p className="text-sm text-gray-600 mt-1.5 break-words">{review.content}</p>

        {/* 리뷰 이미지 */}
        {review.reviewImgUrl && !imgError && (
          <div className="relative w-32 h-32 rounded-xl overflow-hidden mt-2">
            <Image
              src={review.reviewImgUrl}
              alt="리뷰 이미지"
              fill
              className="object-cover"
              onError={() => setImgError(true)}
              sizes="128px"
            />
          </div>
        )}
      </div>

      {/* 삭제 */}
      <button
        onClick={() => onDelete(review.reviewId)}
        className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 self-start mt-1"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
