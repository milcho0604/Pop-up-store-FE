# POPUP 프론트엔드 프로젝트 가이드

> Next.js + TypeScript + Tailwind CSS 기반 팝업스토어 정보 웹앱

---

## 1. 기술 스택 기초 개념

### Next.js란?

React 기반의 **웹 프레임워크**입니다. React만으로는 할 수 없는 것들을 해줍니다:

- **파일 기반 라우팅**: 파일을 만들면 자동으로 URL이 생김 (`app/login/page.tsx` → `/login`)
- **서버 사이드 렌더링(SSR)**: 서버에서 HTML을 미리 만들어서 보내줌 (SEO, 초기 로딩 속도 향상)
- **이미지 최적화**: `<Image>` 컴포넌트로 자동 리사이즈, 포맷 변환
- **폰트 최적화**: 구글 폰트를 자동으로 최적화해서 로딩

### TypeScript (.tsx)란?

JavaScript에 **타입**을 추가한 언어입니다.

```typescript
// JavaScript (타입 없음)
function add(a, b) { return a + b; }
add("hello", 5); // 실행해봐야 버그를 알 수 있음

// TypeScript (타입 있음)
function add(a: number, b: number): number { return a + b; }
add("hello", 5); // 작성하는 순간 빨간줄로 에러 표시
```

- `.ts` = 순수 TypeScript 파일 (화면 없는 로직)
- `.tsx` = TypeScript + JSX (화면 UI가 포함된 파일)

### JSX/TSX란?

JavaScript 안에서 HTML처럼 UI를 작성하는 문법입니다.

```tsx
// 일반 HTML
<div class="title">안녕하세요</div>

// TSX (차이점: class → className, 중괄호로 변수 사용)
<div className="title">{userName}님 안녕하세요</div>
```

### Tailwind CSS란?

CSS를 클래스 이름으로 작성하는 방식입니다.

```tsx
// 기존 CSS 방식
<div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '12px' }}>

// Tailwind 방식 (같은 결과)
<div className="p-4 bg-white rounded-xl">
```

주요 약속:
- `p-4` = padding 16px
- `mt-3` = margin-top 12px
- `text-sm` = font-size 14px
- `bg-gray-100` = 연한 회색 배경
- `rounded-xl` = 둥근 모서리
- `flex` = flexbox 레이아웃

---

## 2. 프로젝트 루트 파일 설명

```
popup-fe/
├── package.json          # 프로젝트 정보 + 사용하는 라이브러리 목록 (npm install 시 참고)
├── tsconfig.json         # TypeScript 설정 (경로 별칭 @/ 등)
├── next.config.ts        # Next.js 설정 (이미지 도메인 허용 등)
├── postcss.config.mjs    # Tailwind CSS 빌드 설정
├── eslint.config.mjs     # 코드 품질 검사 규칙
├── .env.local            # 환경 변수 (API URL 등, git에 올리지 않음)
├── .env.example          # 환경 변수 예시 (이걸 복사해서 .env.local 만듦)
└── .gitignore            # git에 올리지 않을 파일 목록
```

### package.json 핵심

```json
{
  "scripts": {
    "dev": "next dev",       // 개발 서버 실행 (코드 수정하면 즉시 반영)
    "build": "next build",   // 배포용 빌드
    "start": "next start",   // 빌드된 결과물 실행
    "lint": "next lint"      // 코드 품질 검사
  }
}
```

### tsconfig.json 핵심

```jsonㅁㄴㅇ
{ㅇ
  "paths": {
    "@/*": ["./src/*"]  // import 시 @/로 시작하면 src/ 폴더를 뜻함
  }
}
```

```typescript
// 이 설정 덕분에 아래처럼 깔끔하게 import 가능
import Button from '@/components/ui/Button';    // = src/components/ui/Button
import { api } from '@/lib/api';                // = src/lib/api
```

---

## 3. src/app/ - 페이지 (라우팅)

**Next.js App Router의 핵심 규칙:**
- `page.tsx` 파일이 있으면 → 그 폴더 경로가 URL이 됨
- `layout.tsx` 파일은 → 하위 페이지들을 감싸는 공통 틀

```
src/app/
├── layout.tsx              # (A) 루트 레이아웃: 모든 페이지를 감쌈
├── globals.css             # (B) 전역 CSS
├── favicon.ico             # 브라우저 탭 아이콘
│
├── (auth)/                 # (C) 인증 관련 페이지 그룹
│   ├── login/
│   │   └── page.tsx        #     → /login
│   └── signup/
│       └── page.tsx        #     → /signup
│
└── (main)/                 # (D) 메인 페이지 그룹
    ├── layout.tsx           #     메인 레이아웃 (헤더 + 하단 네비)
    ├── page.tsx             #     → / (홈)
    └── popup/
        └── [id]/
            └── page.tsx     #     → /popup/1, /popup/2, ... (동적 라우팅)
```

### (A) layout.tsx - 루트 레이아웃

```
모든 페이지를 감싸는 최상위 틀
┌─────────────────────────┐
│ <html>                  │
│   <body>                │
│     {children} ← 여기에 페이지가 들어감
│   </body>               │
│ </html>                 │
└─────────────────────────┘
```

역할:
- 폰트 로딩 (Geist 폰트)
- 메타데이터 설정 (페이지 제목, 설명)
- globals.css 적용

### (B) globals.css - 전역 스타일

- Tailwind CSS 임포트
- 색상 변수 정의 (배경: 흰색, 글자: 검정)
- 토스트 애니메이션 정의

### (C) (auth) 그룹 - 괄호 폴더란?

**괄호`()`로 감싼 폴더는 URL에 포함되지 않습니다.**

```
(auth)/login/page.tsx  → /login      (auth가 URL에 안 들어감)
(main)/page.tsx        → /           (main이 URL에 안 들어감)
```

이유: 코드를 정리하기 위한 **논리적 그룹**입니다.
- `(auth)` = 로그인, 회원가입 (헤더/하단 네비 없음)
- `(main)` = 메인, 상세 (헤더 + 하단 네비 있음)

### (D) [id] - 동적 라우팅

대괄호 `[]`는 **변하는 값**을 뜻합니다.

```
popup/[id]/page.tsx
  → /popup/1    (id = "1")
  → /popup/42   (id = "42")
  → /popup/999  (id = "999")
```

코드에서 이렇게 받아씁니다:
```tsx
export default function PopupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);  // URL의 id 값을 가져옴
  const postId = Number(id);   // 문자열 → 숫자 변환
}
```

---

## 4. src/app/ 각 페이지 상세

### /login (로그인)

```
파일: src/app/(auth)/login/page.tsx
```

- 이메일 + 비밀번호 입력 폼
- 로그인 성공 시 → JWT 토큰을 localStorage에 저장 → 메인으로 이동
- 비밀번호 찾기 링크
- Google 소셜 로그인 버튼 (아직 미구현)
- 회원가입 링크

### /signup (회원가입)

```
파일: src/app/(auth)/signup/page.tsx
```

3단계 폼:
1. **이메일 입력** → 인증코드 전송
2. **인증코드 입력** → 이메일 확인
3. **정보 입력** (이름, 닉네임, 비밀번호, 전화번호) → 가입 완료 → 로그인 페이지로

### / (메인 홈)

```
파일: src/app/(main)/page.tsx
레이아웃: src/app/(main)/layout.tsx (헤더 + 하단 네비 포함)
```

- 히어로 섹션 ("지금 뜨고 있는 팝업스토어")
- **조회수순 / 좋아요순** 탭 전환
- 전체 게시글을 불러와서 프론트에서 정렬 → 상위 10개
- 자동 슬라이드 캐러셀 (3초 간격)
- 캐러셀 아래에 가로형 카드 리스트

### /popup/[id] (팝업 상세)

```
파일: src/app/(main)/popup/[id]/page.tsx
```

- 이미지 (없으면 기본 플레이스홀더)
- 상태 배지, 태그, 제목
- **좋아요** / **즐겨찾기(저장)** / **공유** 버튼
- 기간, 위치, 운영시간, 입장료, 가까운 지하철 정보
- 소개글
- 작성자 프로필
- 댓글 (조회/작성/삭제)

---

## 5. src/components/ - 재사용 컴포넌트

**컴포넌트란?** UI를 작은 조각으로 나눈 것입니다.
한 번 만들어두면 여러 페이지에서 재사용할 수 있습니다.

```
components/
├── ui/          # 가장 작은 단위. 어디서든 쓸 수 있는 범용 UI
├── common/      # 여러 페이지에 공통으로 들어가는 레이아웃 요소
└── features/    # 특정 비즈니스 기능에 맞춘 복합 컴포넌트
```

### ui/ (기본 UI 컴포넌트)

앱 전체에서 반복적으로 쓰이는 가장 작은 UI 블록입니다.

| 파일 | 역할 | 사용처 |
|------|------|--------|
| **Button.tsx** | 버튼 | 로그인, 회원가입, 댓글 등 |
| **Input.tsx** | 입력창 (라벨, 에러, 비밀번호 토글) | 로그인, 회원가입 |
| **Logo.tsx** | POPUP 로고 (클릭 시 홈으로) | 헤더, 로그인, 회원가입 |
| **Divider.tsx** | 구분선 ("또는" 텍스트 포함 가능) | 로그인 |
| **StatusBadge.tsx** | 상태 표시 (진행중/예정/종료) | 카드, 상세 |
| **DefaultImage.tsx** | 이미지 없을 때 SVG 플레이스홀더 | 카드, 상세 |
| **LoginPrompt.tsx** | 로그인 유도 모달 (확인→로그인, 취소→닫기) | 댓글, 좋아요, 즐겨찾기, 마이, 알림 |

**LoginPrompt 사용 예시:**
```tsx
const [showLogin, setShowLogin] = useState(false);

// 로그인이 필요한 액션에서
const token = localStorage.getItem('token');
if (!token) { setShowLogin(true); return; }

// 렌더링
<LoginPrompt open={showLogin} onClose={() => setShowLogin(false)} />
```

**Button 사용 예시:**
```tsx
// primary(검정), secondary(흰색), text(투명) 스타일
<Button variant="primary" size="lg" fullWidth loading={isLoading}>
  로그인
</Button>
```

**Input 사용 예시:**
```tsx
// 비밀번호 눈 토글 기능
<Input placeholder="비밀번호" showPasswordToggle error="비밀번호가 틀렸습니다" />
```

### common/ (공통 레이아웃 컴포넌트)

| 파일 | 역할 |
|------|------|
| **Header.tsx** | 상단 헤더 (로고 + 알림 아이콘). 스크롤해도 상단 고정 |
| **BottomNav.tsx** | 하단 탭바 (홈, 검색, 커뮤니티, 마이). 하단 고정 |

이 두 컴포넌트는 `(main)/layout.tsx`에서 사용됩니다:

```
┌─────── Header ───────┐
│ POPUP           🔔   │
├──────────────────────┤
│                      │
│    {페이지 내용}      │  ← page.tsx가 여기에 렌더링됨
│                      │
├──────────────────────┤
│ 🏠  🔍  💬  👤      │
└─── BottomNav ────────┘
```

### features/ (기능 컴포넌트)

비즈니스 로직이 포함된 컴포넌트입니다.

| 파일 | 역할 |
|------|------|
| **PopupCard.tsx** | 팝업 카드. `vertical`(세로)과 `horizontal`(가로) 두 가지 형태 |
| **PopupCarousel.tsx** | 자동 슬라이드 캐러셀. 3초마다 다음 카드로 이동 |
| **CommentSection.tsx** | 댓글 영역. 목록 조회 + 작성 + 삭제 + 대댓글 |

**PopupCard 동작 원리:**
```tsx
// 세로형 (메인 캐러셀용)
<PopupCard post={post} />

// 가로형 (리스트용)
<PopupCard post={post} variant="horizontal" />
```

이미지 로딩 실패 시 → `onError` → `imgError` state가 true → `DefaultImage` 표시

---

## 6. src/lib/ - API 통신 + 유틸리티

**lib이란?** Library의 줄임말. 페이지나 컴포넌트에서 공통으로 사용하는 **로직**을 모아둔 곳입니다.
화면(UI)은 없고, 데이터를 가져오거나 처리하는 코드만 있습니다.

```
lib/
├── api.ts        # API 클라이언트 (모든 HTTP 요청의 기반)
├── auth.ts       # 로그인/회원가입 API 함수
├── post.ts       # 팝업스토어 API 함수
├── comment.ts    # 댓글 API 함수
└── favorite.ts   # 즐겨찾기 API 함수
```

### api.ts - API 클라이언트 (핵심)

모든 백엔드 통신의 **기반**입니다. HTTP 요청을 보내는 클래스입니다.

```typescript
// 이렇게 사용합니다:
const result = await api.get('/post/list');           // GET 요청
const result = await api.post('/member/login', data); // POST 요청

// 로그인한 사용자의 요청:
const authApi = api.withAuth(token);                  // 토큰 첨부
const result = await authApi.get('/favorite/list');    // 인증된 GET 요청
```

**withAuth()의 동작:**
```
일반 요청:       GET /post/list
                 Headers: { Content-Type: application/json }

인증된 요청:     GET /favorite/list
                 Headers: { Content-Type: application/json,
                            Authorization: Bearer eyJhbG... }
```

### auth.ts - 인증 API

```typescript
authApi.login({ memberEmail, password })     // 로그인 → JWT 토큰 반환
authApi.sendVerificationCode(email)          // 이메일 인증코드 전송
authApi.verifyEmail(email, code)             // 인증코드 확인
authApi.signup(data, profileImage?)          // 회원가입 (multipart/form-data)
```

### post.ts - 팝업스토어 API

```typescript
postApi.getList()                // 전체 목록
postApi.getPopularList()         // 인기 목록
postApi.getDetail(id)            // 상세 조회
postApi.incrementViews(id)       // 조회수 +1
postApi.like(id, token)          // 좋아요
postApi.unlike(id, token)        // 좋아요 취소
postApi.getLikes(id)             // 좋아요 수 조회
```

### comment.ts - 댓글 API

```typescript
commentApi.getList(postId)                                  // 댓글 목록
commentApi.create({ postId, content }, token)                // 댓글 작성
commentApi.reply({ postId, parentId, content }, token)       // 대댓글 작성
commentApi.delete(commentId, token)                          // 댓글 삭제
```

### favorite.ts - 즐겨찾기 API

```typescript
favoriteApi.check(postId, token)   // 즐겨찾기 여부 확인 → true/false
favoriteApi.add(postId, token)     // 즐겨찾기 추가
favoriteApi.remove(postId, token)  // 즐겨찾기 삭제
```

---

## 7. src/types/ - TypeScript 타입 정의

**types란?** 데이터의 **모양(구조)**을 미리 정의해놓은 것입니다.

백엔드에서 오는 JSON 데이터가 어떤 필드를 가지는지 TypeScript에게 알려줍니다.
이 덕분에 오타, 잘못된 필드 접근을 **코드 작성 시점에** 잡아낼 수 있습니다.

```
types/
├── auth.ts       # 로그인 요청 타입
├── post.ts       # 팝업스토어 목록/상세 타입
├── comment.ts    # 댓글 타입
└── member.ts     # 회원가입 타입
```

### 타입 예시 (post.ts)

```typescript
// 백엔드 응답 JSON:
// { "id": 1, "title": "나이키 팝업", "city": "서울", "likeCount": 42, ... }

// 이 JSON의 모양을 TypeScript로 정의:
export interface PostListDto {
  id: number;            // 숫자
  title: string;         // 문자열
  city: string;
  likeCount: number;
  status: string;        // "ONGOING" | "UPCOMING" | "ENDED"
  tags: TagDto[];        // TagDto 배열(목록)
  // ...
}
```

이렇게 정의해두면:
```typescript
const post: PostListDto = await getPost();
post.title   // ✅ 자동완성됨
post.tite    // ❌ 빨간줄 (오타 잡아줌)
post.price   // ❌ 빨간줄 (없는 필드 잡아줌)
```

---

## 8. 데이터 흐름 (전체 그림)

```
사용자가 /popup/3 접속
        │
        ▼
┌─ page.tsx (UI) ──────────────────────────────┐
│                                              │
│  useEffect에서 데이터 요청                      │
│       │                                      │
│       ▼                                      │
│  lib/post.ts                                 │
│  postApi.getDetail(3)                        │
│       │                                      │
│       ▼                                      │
│  lib/api.ts                                  │
│  fetch("http://localhost:8080/post/detail/3") │
│       │                                      │
│       ▼                                      │
│  백엔드 서버 (Spring Boot)                     │
│       │                                      │
│       ▼                                      │
│  JSON 응답 → types/post.ts 타입으로 변환        │
│       │                                      │
│       ▼                                      │
│  useState로 화면에 렌더링                       │
│  components/ui/StatusBadge 등 사용              │
└──────────────────────────────────────────────┘
```

---

## 9. React/Next.js 핵심 개념

### 'use client'

파일 맨 위에 `'use client';`가 있으면 → **브라우저에서 실행**되는 컴포넌트입니다.

```tsx
'use client';  // 이 파일은 브라우저에서 동작 (버튼 클릭, 상태 변경 등)

// use client가 없으면 → 서버에서만 실행 (정적 페이지)
```

**언제 필요?**
- `useState`, `useEffect` 같은 React Hook을 쓸 때
- `onClick`, `onChange` 같은 이벤트를 처리할 때
- `localStorage`에 접근할 때

### useState - 상태 관리

화면에 **변하는 값**을 관리합니다.

```tsx
const [count, setCount] = useState(0);
// count = 현재 값 (0)
// setCount = 값을 바꾸는 함수

setCount(5);  // count가 5로 바뀜 → 화면이 자동으로 다시 그려짐
```

### useEffect - 부수 효과

컴포넌트가 **화면에 나타난 후** 실행되는 코드입니다.

```tsx
useEffect(() => {
  // 페이지가 로드되면 API 호출
  fetchData();
}, [postId]);
// ↑ postId가 바뀔 때마다 다시 실행
// [] 빈 배열이면 → 최초 1번만 실행
```

### Props - 컴포넌트에 데이터 전달

```tsx
// 부모가 자식에게 데이터를 전달
<PopupCard post={postData} variant="horizontal" />

// 자식 컴포넌트에서 받아서 사용
function PopupCard({ post, variant }: PopupCardProps) {
  return <h3>{post.title}</h3>;
}
```

---

## 10. 주요 패턴 요약

| 패턴 | 설명 | 예시 |
|------|------|------|
| **파일 기반 라우팅** | 폴더 구조 = URL 구조 | `app/(main)/popup/[id]/page.tsx` → `/popup/3` |
| **괄호 폴더** | URL에 안 나오는 논리 그룹 | `(auth)`, `(main)` |
| **대괄호 폴더** | URL의 동적 부분 | `[id]` → 1, 2, 3, ... |
| **layout.tsx** | 하위 페이지를 감싸는 공통 틀 | 헤더 + 네비 |
| **page.tsx** | 실제 페이지 내용 | 홈, 로그인, 상세 |
| **컴포넌트 분리** | ui → common → features 순 | Button → Header → PopupCard |
| **lib 분리** | API 호출 로직을 페이지와 분리 | postApi.getDetail() |
| **types 분리** | 데이터 구조를 별도 파일로 정의 | PostDetailDto |
| **'use client'** | 브라우저에서 실행할 컴포넌트 표시 | 클릭, 상태, API 호출 |
