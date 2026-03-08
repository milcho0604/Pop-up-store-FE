import { loadKakaoMaps } from './kakao';

export interface LocationInfo {
  dong: string;   // 동 (예: 역삼1동)
  gu: string;     // 구 (예: 강남구)
  city: string;   // 시/도 (예: 서울)
  label: string;  // 표시용 (예: 강남구 역삼1동)
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
  await loadKakaoMaps();
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
