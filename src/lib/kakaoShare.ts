declare global {
  interface Window {
    Kakao: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

export function loadKakaoShare(): Promise<void> {
  return new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!key) { reject(new Error('카카오 키가 없습니다.')); return; }

    if (window.Kakao?.isInitialized?.()) { resolve(); return; }

    if (window.Kakao) {
      window.Kakao.init(key);
      resolve();
      return;
    }

    const existing = document.getElementById('kakao-sdk-script');
    if (existing) {
      existing.addEventListener('load', () => { window.Kakao.init(key); resolve(); });
      return;
    }

    const script = document.createElement('script');
    script.id = 'kakao-sdk-script';
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.onload = () => { window.Kakao.init(key); resolve(); };
    script.onerror = () => reject(new Error('카카오 SDK 로드 실패'));
    document.head.appendChild(script);
  });
}

export function shareToKakao(title: string, description: string, imageUrl: string | null, url: string) {
  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title,
      description,
      imageUrl: imageUrl ?? undefined,
      link: { mobileWebUrl: url, webUrl: url },
    },
  });
}
