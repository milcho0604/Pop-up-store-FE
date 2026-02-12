'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PostListDto } from '@/types/post';
import { postApi } from '@/lib/post';
import PopupCard from '@/components/features/PopupCard';

type SortType = 'LATEST' | 'POPULAR' | 'VIEW_COUNT' | 'ENDING_SOON';

const sortOptions: { key: SortType; label: string }[] = [
  { key: 'LATEST', label: '최신순' },
  { key: 'POPULAR', label: '인기순' },
  { key: 'VIEW_COUNT', label: '조회순' },
  { key: 'ENDING_SOON', label: '마감임박' },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialKeyword = searchParams.get('keyword') ?? '';

  const [keyword, setKeyword] = useState(initialKeyword);
  const [results, setResults] = useState<PostListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sort, setSort] = useState<SortType>('LATEST');

  const doSearch = useCallback(async (query: string, sortBy: SortType) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await postApi.searchAll({
        keyword: query || undefined,
        sortBy,
      });
      setResults(res.result ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // URL 파라미터로 초기 검색
  useEffect(() => {
    if (initialKeyword) {
      doSearch(initialKeyword, sort);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    // URL 업데이트
    if (trimmed) {
      router.replace(`/search?keyword=${encodeURIComponent(trimmed)}`);
    } else {
      router.replace('/search');
    }
    doSearch(trimmed, sort);
  };

  const handleSortChange = (newSort: SortType) => {
    setSort(newSort);
    if (searched) {
      doSearch(keyword.trim(), newSort);
    }
  };

  return (
    <div className="px-5 pt-4">
      {/* 검색바 */}
      <form onSubmit={handleSearch} className="mb-5">
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
            autoFocus
            className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
          />
        </div>
      </form>

      {/* 정렬 탭 */}
      {searched && (
        <div className="flex gap-2 mb-5">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSortChange(opt.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                sort === opt.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-24 h-24 rounded-2xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-3 bg-gray-100 rounded w-1/4" />
                <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 검색 결과 */}
      {!loading && searched && results.length > 0 && (
        <>
          <p className="text-xs text-gray-400 mb-4">
            검색 결과 {results.length}건
          </p>
          <div className="space-y-5">
            {results.map((post) => (
              <PopupCard key={post.id} post={post} variant="horizontal" />
            ))}
          </div>
        </>
      )}

      {/* 결과 없음 */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">검색 결과가 없습니다</p>
          <p className="text-xs text-gray-300 mt-1">다른 키워드로 검색해보세요</p>
        </div>
      )}

      {/* 초기 상태 (검색 전) */}
      {!loading && !searched && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">찾고 싶은 팝업스토어를 검색해보세요</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="px-5 pt-4">
        <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
