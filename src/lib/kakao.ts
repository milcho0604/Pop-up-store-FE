declare global {
  interface Window {
    kakao: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

/**
 * 카카오맵 SDK(services 포함)를 로드하고 초기화합니다.
 * 이미 초기화된 경우 즉시 resolve됩니다.
 */
export function loadKakaoMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 이미 services까지 완전히 로드된 경우
    if (window.kakao?.maps?.services) {
      resolve();
      return;
    }

    const doLoad = () => window.kakao.maps.load(resolve);

    // 스크립트는 로드됐지만 load() 미호출인 경우
    if (window.kakao?.maps) {
      doLoad();
      return;
    }

    const existing = document.getElementById('kakao-map-script') as HTMLScriptElement | null;
    if (existing) {
      // 스크립트가 이미 로드 완료됐으나 kakao 객체가 없는 경우는 없음
      // → 아직 로딩 중이므로 이벤트 리스너 등록
      existing.addEventListener('load', doLoad);
      return;
    }

    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!key) {
      reject(new Error('카카오맵 키가 없습니다.'));
      return;
    }

    const script = document.createElement('script');
    script.id = 'kakao-map-script';
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
    script.onload = doLoad;
    script.onerror = () => reject(new Error('카카오맵 스크립트 로드 실패'));
    document.head.appendChild(script);
  });
}
