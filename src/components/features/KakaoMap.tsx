'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    kakao: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

interface KakaoMapProps {
  address: string;
  title?: string;
}

export default function KakaoMap({ address, title }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  useEffect(() => {
    if (!address || !mapRef.current || !KAKAO_KEY) return;

    const initMap = () => {
      window.kakao.maps.load(() => {
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result: any, status: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (status === window.kakao.maps.services.Status.OK && mapRef.current) {
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
          }
        });
      });
    };

    if (window.kakao?.maps) {
      initMap();
      return;
    }

    const existingScript = document.getElementById('kakao-map-script');
    if (existingScript) {
      existingScript.addEventListener('load', initMap);
      return () => existingScript.removeEventListener('load', initMap);
    }

    const script = document.createElement('script');
    script.id = 'kakao-map-script';
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services&autoload=false`;
    script.addEventListener('load', initMap);
    document.head.appendChild(script);

    return () => script.removeEventListener('load', initMap);
  }, [address, title, KAKAO_KEY]);

  return (
    <div ref={mapRef} className="w-full h-52 rounded-2xl overflow-hidden bg-gray-100" />
  );
}
