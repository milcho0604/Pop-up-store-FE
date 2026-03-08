'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PostListDto } from '@/types/post';
import { postApi } from '@/lib/post';
import { loadKakaoMaps } from '@/lib/kakao';
import StatusBadge from '@/components/ui/StatusBadge';
import DefaultImage from '@/components/ui/DefaultImage';

export default function MapPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);

  const [posts, setPosts] = useState<PostListDto[]>([]);
  const [selected, setSelected] = useState<PostListDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [geocodedCount, setGeocodedCount] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    postApi.getList()
      .then((res) => setPosts(res.result ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !posts.length || !mapRef.current) return;

    const postsWithAddr = posts.filter((p) => p.street || p.dong || p.city);
    let cancelled = false;

    loadKakaoMaps().then(() => {
      if (cancelled || !mapRef.current) return;

      const center = new window.kakao.maps.LatLng(37.5665, 126.9780); // 서울 기본
      const map = new window.kakao.maps.Map(mapRef.current, { center, level: 8 });
      window.kakao.maps.event.addListener(map, 'click', () => setSelected(null));

      const geocoder = new window.kakao.maps.services.Geocoder();

      postsWithAddr.forEach((post, idx) => {
        const address = [post.city, post.dong, post.street].filter(Boolean).join(' ');
        if (!address) return;

        setTimeout(() => {
          if (cancelled) return;
          geocoder.addressSearch(address, (result: any, status: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (!cancelled && status === window.kakao.maps.services.Status.OK) {
              const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
              const marker = new window.kakao.maps.Marker({ map, position: coords, title: post.title });
              window.kakao.maps.event.addListener(marker, 'click', () => {
                setSelected(post);
                setImgError(false);
                map.panTo(coords);
              });
            }
            setGeocodedCount((c) => c + 1);
          });
        }, idx * 120);
      });
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [loading, posts]);

  const postsWithAddr = posts.filter((p) => p.street || p.dong || p.city);
  const allGeocoded = !loading && geocodedCount >= postsWithAddr.length && postsWithAddr.length > 0;

  return (
    // 헤더(56px) + 바텀내비(64px) 제외한 전체 높이
    <div className="relative" style={{ height: 'calc(100dvh - 56px - 64px)' }}>

      {/* 지도 */}
      <div ref={mapRef} className="w-full h-full" />

      {/* 로딩 오버레이 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      )}

      {/* 지오코딩 진행 표시 */}
      {!loading && !allGeocoded && postsWithAddr.length > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs text-gray-500 shadow-sm pointer-events-none">
          팝업 위치 불러오는 중 {geocodedCount}/{postsWithAddr.length}
        </div>
      )}

      {/* 팝업 수 뱃지 */}
      {allGeocoded && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs text-gray-600 shadow-sm pointer-events-none">
          팝업 {postsWithAddr.length}개
        </div>
      )}

      {/* 선택된 팝업 카드 */}
      {selected && (
        <div className="absolute bottom-3 left-3 right-3 bg-white rounded-2xl shadow-xl overflow-hidden">
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(null); }}
            className="absolute top-3 right-3 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <button
            onClick={() => router.push(`/popup/${selected.id}`)}
            className="flex gap-3 p-4 w-full text-left hover:bg-gray-50 transition-colors"
          >
            <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
              {selected.postImgUrl && !imgError ? (
                <Image
                  src={selected.postImgUrl}
                  alt={selected.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                  onError={() => setImgError(true)}
                />
              ) : (
                <DefaultImage className="w-full h-full" />
              )}
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <StatusBadge status={selected.status} className="mb-1" />
              <p className="text-sm font-semibold text-gray-900 truncate">{selected.title}</p>
              {(selected.city || selected.dong) && (
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {[selected.city, selected.dong].filter(Boolean).join(' ')}
                </p>
              )}
              {(selected.startDate || selected.endDate) && (
                <p className="text-xs text-gray-300 mt-0.5">
                  {selected.startDate?.slice(0, 10)} ~ {selected.endDate?.slice(0, 10)}
                </p>
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
