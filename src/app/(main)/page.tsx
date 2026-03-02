'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PostListDto } from '@/types/post';
import { postApi } from '@/lib/post';
import { isAdmin } from '@/lib/auth';
import { getCurrentLocation, LocationInfo } from '@/lib/location';
import PopupCard from '@/components/features/PopupCard';
import PopupCarousel from '@/components/features/PopupCarousel';

type SortType = 'views' | 'likes';
type StatusFilter = 'ALL' | 'ONGOING' | 'UPCOMING' | 'ENDED';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'ONGOING', label: '운영중' },
  { value: 'UPCOMING', label: '오픈 예정' },
  { value: 'ENDED', label: '종료' },
];

export default function HomePage() {
  const router = useRouter();
  const [allPosts, setAllPosts] = useState<PostListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sort, setSort] = useState<SortType>('views');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [keyword, setKeyword] = useState('');
  const [admin, setAdmin] = useState(false);

  // 현재 위치 기반
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [nearbyPosts, setNearbyPosts] = useState<PostListDto[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setAdmin(isAdmin(token));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;
    router.push(`/search?keyword=${encodeURIComponent(trimmed)}`);
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await postApi.getList();
        setAllPosts(res.result ?? []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleGetLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    setNearbyPosts([]);
    try {
      const info = await getCurrentLocation();
      setLocationInfo(info);
      // 동 기준으로 검색, 없으면 구 기준
      const dong = info.dong || info.gu;
      const res = await postApi.searchAll({ dong });
      setNearbyPosts(res.result ?? []);
      if ((res.result ?? []).length === 0) {
        setLocationError(`${info.label} 근처에 등록된 팝업스토어가 없습니다`);
      }
    } catch (e: unknown) {
      const msg = e instanceof GeolocationPositionError
        ? (e.code === 1 ? '위치 접근 권한이 거부되었습니다' : '위치를 가져올 수 없습니다')
        : '위치를 가져올 수 없습니다';
      setLocationError(msg);
    } finally {
      setLocationLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    if (statusFilter === 'ALL') return allPosts;
    return allPosts.filter((post) => post.status === statusFilter);
  }, [allPosts, statusFilter]);

  const popularPosts = useMemo(() => {
    const sorted = [...filteredPosts].sort((a, b) =>
      sort === 'views'
        ? (b.viewCount ?? 0) - (a.viewCount ?? 0)
        : (b.likeCount ?? 0) - (a.likeCount ?? 0)
    );
    return sorted.slice(0, 10);
  }, [filteredPosts, sort]);

  return (
    <div className="px-5 pt-4">
      {/* Hero Section */}
      <section className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          지금 뜨고 있는
          <br />
          <span className="text-gray-400">팝업스토어</span>
        </h1>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-gray-400">
            가장 인기있는 팝업스토어를 만나보세요
          </p>
          {admin && (
            <Link
              href="/popup/create"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              팝업 등록
            </Link>
          )}
        </div>

        {/* 검색바 */}
        <form onSubmit={handleSearch} className="mt-4">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300"
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="팝업스토어를 검색해보세요"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            />
          </div>
        </form>

        {/* 상태 필터 */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === filter.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {/* 현재 위치 기반 팝업 섹션 */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">내 주변 팝업</h2>
          <button
            onClick={handleGetLocation}
            disabled={locationLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {locationLoading ? (
              <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            )}
            {locationInfo ? locationInfo.label : '현재 위치'}
          </button>
        </div>

        {!locationInfo && !locationLoading && !locationError && (
          <p className="text-xs text-gray-300 text-center py-6">
            위치 버튼을 눌러 주변 팝업스토어를 찾아보세요
          </p>
        )}

        {locationError && (
          <p className="text-xs text-gray-400 text-center py-6">{locationError}</p>
        )}

        {locationLoading && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!locationLoading && nearbyPosts.length > 0 && (
          <div className="space-y-4">
            {nearbyPosts.slice(0, 5).map((post) => (
              <PopupCard key={post.id} post={post} variant="horizontal" />
            ))}
            {nearbyPosts.length > 5 && (
              <button
                onClick={() => router.push(`/search?dong=${encodeURIComponent(locationInfo?.dong || locationInfo?.gu || '')}`)}
                className="w-full py-2.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                {locationInfo?.label} 팝업 전체보기 ({nearbyPosts.length}개)
              </button>
            )}
          </div>
        )}
      </section>

      {/* Popular Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">인기 팝업</h2>
          <Link
            href="/search"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            전체보기
          </Link>
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setSort('views')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              sort === 'views'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            조회수순
          </button>
          <button
            onClick={() => setSort('likes')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              sort === 'likes'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            좋아요순
          </button>
        </div>

        {loading && (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[60vw] max-w-[240px] animate-pulse">
                <div className="aspect-[4/5] rounded-2xl bg-gray-100" />
                <div className="mt-3 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">
              팝업스토어를 불러올 수 없습니다
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-gray-900 font-medium hover:underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && popularPosts.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">
              {statusFilter === 'ALL'
                ? '아직 등록된 팝업스토어가 없습니다'
                : `${statusFilters.find((f) => f.value === statusFilter)?.label} 팝업스토어가 없습니다`}
            </p>
          </div>
        )}

        {!loading && !error && popularPosts.length > 0 && (
          <>
            {/* Popular Carousel - auto slide, max 10 */}
            <PopupCarousel
              key={sort}
              posts={popularPosts}
              maxItems={10}
              autoPlayInterval={3000}
            />

            {/* Rest - Horizontal Cards */}
            {popularPosts.length > 3 && (
              <div className="mt-8">
                <h2 className="text-base font-semibold text-gray-900 mb-4">더 많은 팝업</h2>
                <div className="space-y-5">
                  {popularPosts.slice(3, 10).map((post) => (
                    <PopupCard key={post.id} post={post} variant="horizontal" />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
