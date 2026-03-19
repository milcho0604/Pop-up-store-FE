# Project Memory

## 스타일링 방침
- **Tailwind CSS 인라인 방식** 사용 (별도 CSS 파일 분리 X)
- 공통 CSS는 `src/app/globals.css` 하나만 사용 (Tailwind import + 테마 변수 + 커스텀 애니메이션)
- 스타일 반복이 생기면 별도 CSS가 아닌 **컴포넌트 분리**로 해결
- className에 Tailwind 유틸리티 클래스를 직접 작성하는 패턴 유지

## 프로젝트 구조 패턴
- Next.js 14 App Router + TypeScript + Tailwind CSS
- 컴포넌트: `src/components/features/` (기능별), `src/components/ui/` (공통 UI)
- API 클라이언트: `src/lib/` (api.ts, comment.ts, post.ts 등)
- 타입 정의: `src/types/`
- 백엔드 경로: `~/Project/popup` (Spring Boot) — 새 PC에서는 CLAUDE.md의 경로도 함께 수정

## 구현 이력
- 댓글 대댓글 기능 구현 완료 (백엔드 `POST /comment/reply` 연동, 2단계 중첩까지 허용)

## Capacitor 앱 빌드 시 할 일
- **검색 히스토리 스토리지 추상화**: localStorage 대신 `@capacitor/preferences` 사용 권장
  - `getItem/setItem` 래퍼 함수를 만들어 환경(웹/네이티브)에 따라 자동 전환
  - iOS는 OS가 WebView localStorage를 날릴 수 있어 불안정 → NSUserDefaults가 안전
  - Capacitor 세팅 시 같이 구현할 것 (사용자가 요청)

## 현재 우선순위 메모
- 문서보다 실제 코드가 최신 상태임
  - 실제 스택은 `Next.js 16.1.4`, `React 19.2.3`
  - `CLAUDE.md`, `docs/PROJECT_GUIDE.md`, `README.md`는 현재 코드 기준으로 다시 정리 필요
- 다음 핵심 작업은 인증/스토리지 추상화 정리
  - `storage.ts`는 있지만 인증 토큰 접근은 아직 여러 곳에서 `localStorage` 직접 사용 중
  - Capacitor 전환 전 토큰 저장/조회/삭제를 공통 경로로 모아야 함
- 에러 처리가 약한 페이지가 많음
  - `catch {}` 또는 조용히 무시하는 패턴이 많아서 사용자 피드백 보강 필요
- 타입 정리 필요
  - 특히 댓글 타입에 백엔드 잔재 필드명(`doctorEmail`, `PostId`)이 남아 있어 주의
- 로그인 화면의 Google 버튼은 현재 placeholder 성격
  - 실제 소셜 로그인 연동 전까지는 미구현 기능으로 봐야 함
- 테스트 파일이 아직 없음
  - 이후 순수 로직(`auth`, `storage`, `search history` 등)부터 최소 테스트 기반 추가 필요
