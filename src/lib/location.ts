declare global {
  interface Window {
    kakao: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

export interface LocationInfo {
  dong: string;   // 동 (예: 역삼1동)
  gu: string;     // 구 (예: 강남구)
  city: string;   // 시/도 (예: 서울)
  label: string;  // 표시용 (예: 강남구 역삼1동)
}

function loadKakaoScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      resolve();
      return;
    }

    const existing = document.getElementById('kakao-map-script');
    if (existing) {
      existing.addEventListener('load', () => window.kakao.maps.load(resolve));
      return;
    }

    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!key) { reject(new Error('카카오맵 키가 없습니다.')); return; }

    const script = document.createElement('script');
    script.id = 'kakao-map-script';
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('위치 정보를 지원하지 않는 브라우저입니다.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
      maximumAge: 60000,
    });
  });
}

export async function getCurrentLocation(): Promise<LocationInfo> {
  await loadKakaoScript();
  const position = await getBrowserPosition();

  return new Promise((resolve, reject) => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(
      position.coords.longitude,
      position.coords.latitude,
      (result: any, status: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (status !== window.kakao.maps.services.Status.OK || !result[0]) {
          reject(new Error('주소를 가져올 수 없습니다.'));
          return;
        }
        const addr = result[0].address;
        const dong = addr.region_3depth_name ?? '';
        const gu   = addr.region_2depth_name ?? '';
        const city = addr.region_1depth_name ?? '';
        resolve({
          dong,
          gu,
          city,
          label: gu && dong ? `${gu} ${dong}` : gu || dong,
        });
      }
    );
  });
}
