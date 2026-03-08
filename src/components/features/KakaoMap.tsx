'use client';

import { useEffect, useRef } from 'react';
import { loadKakaoMaps } from '@/lib/kakao';

interface KakaoMapProps {
  address: string;
  title?: string;
}

export default function KakaoMap({ address, title }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!address || !mapRef.current) return;

    let cancelled = false;

    loadKakaoMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;

        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result: any, status: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (cancelled || !mapRef.current) return;
          if (status !== window.kakao.maps.services.Status.OK) return;

          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
          const map = new window.kakao.maps.Map(mapRef.current, {
            center: coords,
            level: 3,
          });
          new window.kakao.maps.Marker({
            map,
            position: coords,
            title: title ?? address,
          });
        });
      })
      .catch(() => {/* 지도 로드 실패 시 placeholder 유지 */});

    return () => { cancelled = true; };
  }, [address, title]);

  return (
    <div ref={mapRef} className="w-full h-52 rounded-2xl overflow-hidden bg-gray-100" />
  );
}
