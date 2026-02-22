'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { memberApi } from '@/lib/member';
import { followApi } from '@/lib/follow';
import { favoriteApi } from '@/lib/favorite';
import { informationApi } from '@/lib/information';
import { postApi } from '@/lib/post';
import { reviewApi } from '@/lib/review';
import { MemberProfileResDto, FavoriteResDto, InformationListDto, FollowStatsDto } from '@/types/member';
import { PostListDto } from '@/types/post';
import { ReviewResDto } from '@/types/review';
import LoginPrompt from '@/components/ui/LoginPrompt';
import DefaultImage from '@/components/ui/DefaultImage';

type TabType = 'favorites' | 'myPosts' | 'myReviews' | 'reports';

const statusLabel: Record<string, { text: string; color: string }> = {
  PENDING: { text: '대기', color: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { text: '승인', color: 'bg-green-100 text-green-700' },
  REJECTED: { text: '반려', color: 'bg-red-100 text-red-700' },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}.${d}`;
}

export default function MyPage() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [profile, setProfile] = useState<MemberProfileResDto | null>(null);
  const [followStats, setFollowStats] = useState<FollowStatsDto | null>(null);
  const [favorites, setFavorites] = useState<FavoriteResDto[]>([]);
  const [myPosts, setMyPosts] = useState<PostListDto[]>([]);
  const [myReviews, setMyReviews] = useState<ReviewResDto[]>([]);
  const [reports, setReports] = useState<InformationListDto[]>([]);
  const [tab, setTab] = useState<TabType>('favorites');
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getToken = () => localStorage.getItem('token');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getToken();
    if (!token) return;

    setUploadingImage(true);
    try {
      const res = await memberApi.updateProfile(token, {}, file);
      if (res.result) {
        setProfile(res.result);
        setImgError(false);
      }
    } catch {
      // 업로드 실패 시 조용히 처리
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // 프로필 + 팔로우 통계 로드
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setShowLogin(true);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          memberApi.getProfile(token),
          followApi.getMyStats(token),
        ]);
        setProfile(profileRes.result);
        setFollowStats(statsRes.result);
      } catch {
        // 토큰 만료 등
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // 탭 데이터 로드
  useEffect(() => {
    const token = getToken();
    if (!token || !profile) return;

    const fetchTabData = async () => {
      setTabLoading(true);
      try {
        if (tab === 'favorites' && favorites.length === 0) {
          const res = await favoriteApi.getMyList(token);
          setFavorites(res.result ?? []);
        } else if (tab === 'myPosts' && myPosts.length === 0) {
          const res = await postApi.getMyList(token);
          setMyPosts(res.result ?? []);
        } else if (tab === 'myReviews' && myReviews.length === 0) {
          const res = await reviewApi.getMyList(token);
          setMyReviews(res.result ?? []);
        } else if (tab === 'reports' && reports.length === 0) {
          const res = await informationApi.getMyList(token);
          setReports(res.result ?? []);
        }
      } catch {
        // 에러 시 조용히 처리
      } finally {
        setTabLoading(false);
      }
    };

    fetchTabData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, profile]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new CustomEvent('auth-change'));
    router.push('/');
  };

  const hasProfileImage = profile?.profileImgUrl && !imgError;

  return (
    <>
      <div className="px-5 pt-4">
        {/* 프로필 스켈레톤 */}
        {loading && (
          <div className="animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
            <div className="flex gap-6 mb-6">
              <div className="h-10 bg-gray-100 rounded w-20" />
              <div className="h-10 bg-gray-100 rounded w-20" />
            </div>
          </div>
        )}

        {/* 프로필 영역 */}
        {!loading && profile && (
          <>
            <div className="flex items-center gap-4 mb-5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 group"
              >
                {hasProfileImage ? (
                  <Image
                    src={profile.profileImgUrl}
                    alt={profile.nickname}
                    fill
                    className="object-cover"
                    onError={() => setImgError(true)}
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                {uploadingImage ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">{profile.nickname}</h1>
                <p className="text-xs text-gray-400 truncate">{profile.memberEmail}</p>
              </div>
            </div>

            {/* 팔로우 통계 */}
            <div className="flex gap-6 mb-5">
              <Link href="/mypage/follows?tab=followers" className="text-center">
                <p className="text-base font-bold text-gray-900">{followStats?.followerCount ?? 0}</p>
                <p className="text-xs text-gray-400">팔로워</p>
              </Link>
              <Link href="/mypage/follows?tab=followings" className="text-center">
                <p className="text-base font-bold text-gray-900">{followStats?.followingCount ?? 0}</p>
                <p className="text-xs text-gray-400">팔로잉</p>
              </Link>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 mb-5">
              <Link
                href="/mypage/edit"
                className="flex-1 py-2.5 text-center text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                프로필 수정
              </Link>
              <Link
                href="/report"
                className="flex-1 py-2.5 text-center text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                팝업 제보
              </Link>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                로그아웃
              </button>
            </div>

            {/* 탭 */}
            <div className="flex gap-2 mb-5">
              {([
                { key: 'favorites' as const, label: '즐겨찾기' },
                { key: 'myPosts' as const, label: '내 게시글' },
                { key: 'myReviews' as const, label: '내 리뷰' },
                { key: 'reports' as const, label: '내 제보' },
              ]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    tab === t.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 탭 로딩 */}
            {tabLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-2">
                      <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 즐겨찾기 탭 */}
            {!tabLoading && tab === 'favorites' && (
              <>
                {favorites.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400">즐겨찾기한 팝업이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {favorites.map((fav) => (
                      <FavoriteCard key={fav.favoriteId} favorite={fav} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* 내 게시글 탭 */}
            {!tabLoading && tab === 'myPosts' && (
              <>
                {myPosts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400">작성한 게시글이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {myPosts.map((post) => (
                      <FavoriteCard
                        key={post.id}
                        favorite={{
                          favoriteId: post.id,
                          postId: post.id,
                          postTitle: post.title,
                          postContent: post.content,
                          postImgUrl: post.postImgUrl,
                          category: post.category,
                          startDate: post.startDate,
                          endDate: post.endDate,
                          city: post.city,
                          street: post.street,
                          zipcode: post.zipcode,
                          favoritedAt: post.createdTimeAt,
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* 내 리뷰 탭 */}
            {!tabLoading && tab === 'myReviews' && (
              <>
                {myReviews.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400">작성한 리뷰가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myReviews.map((review) => (
                      <Link key={review.reviewId} href={`/popup/${review.postId}`} className="block p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-900 truncate">{review.postTitle}</span>
                          <span className="text-xs text-yellow-500 font-medium flex-shrink-0 ml-2">★ {review.rating.toFixed(1)}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{review.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-gray-300">
                            만족 {review.satisfaction} · 대기 {review.waitingTime} · 포토 {review.photoAvailability}
                          </span>
                          <span className="text-[10px] text-gray-300">{formatDate(review.createdAt)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* 내 제보 탭 */}
            {!tabLoading && tab === 'reports' && (
              <>
                {reports.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400">제보한 팝업이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {reports.map((report) => (
                      <ReportCard key={report.id} report={report} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <LoginPrompt open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}

function FavoriteCard({ favorite }: { favorite: FavoriteResDto }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = favorite.postImgUrl && !imgError;

  return (
    <Link href={`/popup/${favorite.postId}`} className="flex gap-4 group">
      <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
        {hasImage ? (
          <Image
            src={favorite.postImgUrl}
            alt={favorite.postTitle}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            sizes="96px"
          />
        ) : (
          <DefaultImage className="w-full h-full" />
        )}
      </div>
      <div className="flex flex-col justify-center min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{favorite.postTitle}</h3>
        <p className="text-xs text-gray-400 mt-1">{favorite.city}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDate(favorite.startDate)} - {formatDate(favorite.endDate)}
        </p>
      </div>
    </Link>
  );
}

function ReportCard({ report }: { report: InformationListDto }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = report.postImgUrl && !imgError;
  const status = statusLabel[report.status] ?? statusLabel.PENDING;

  return (
    <div className="flex gap-4">
      <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
        {hasImage ? (
          <Image
            src={report.postImgUrl}
            alt={report.title}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            sizes="96px"
          />
        ) : (
          <DefaultImage className="w-full h-full" />
        )}
      </div>
      <div className="flex flex-col justify-center min-w-0">
        <span className={`self-start px-2 py-0.5 rounded text-[10px] font-medium mb-1.5 ${status.color}`}>
          {status.text}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 truncate">{report.title}</h3>
        <p className="text-xs text-gray-400 mt-1">{report.city} {report.dong}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDate(report.startDate)} - {formatDate(report.endDate)}
        </p>
      </div>
    </div>
  );
}
