# CLAUDE.md

팝업스토어 정보 서비스의 프론트엔드 프로젝트입니다.

## 관련 프로젝트

| 프로젝트 | 경로 | 설명 |
|---------|------|------|
| **백엔드** | `/Users/milcho/Project/popup` | Spring Boot API 서버 |
| **프론트엔드** | `/Users/milcho/Project/popup-fe` | Next.js 웹앱 (현재 프로젝트) |

백엔드 코드를 확인해야 할 경우 위 경로를 직접 읽을 수 있습니다.

### 백엔드 주요 파일 경로
```
/Users/milcho/Project/popup/
├── src/main/java/com/store/popup/
│   ├── member/controller/MemberAuthController.java    # 인증 API
│   ├── pop/controller/PostController.java             # 팝업 API
│   ├── notification/controller/NotificationController.java  # 알림 API
│   ├── notification/controller/FcmController.java     # FCM API
│   ├── comment/controller/CommentController.java      # 댓글 API
│   └── CLAUDE.md                                      # 백엔드 문서
```

## 프로젝트 개요

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **상태관리**: (추가 예정)
- **앱 빌드**: Capacitor (추가 예정)

## 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm run start

# 린트
npm run lint
```

## 환경 변수 설정

`.env.local` 파일 생성 (`.env.example` 참고):
```bash
cp .env.example .env.local
```

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 현재 구현 상태

### 완료된 기능
- [x] 프로젝트 초기 설정 (Next.js + TypeScript + Tailwind)
- [x] API 클라이언트 (`src/lib/api.ts`)
- [x] 환경 변수 설정
- [x] 헬스체크 연동 테스트

### 구현 예정
- [ ] 로그인/회원가입 페이지
- [ ] 팝업스토어 목록/상세 페이지
- [ ] 검색 기능
- [ ] 알림 기능
- [ ] FCM 푸시 알림
- [ ] Capacitor 앱 빌드

## 현재 폴더 구조

```
src/
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   └── page.tsx            # 홈 (헬스체크 테스트)
└── lib/
    └── api.ts              # API 클라이언트
```

## API 클라이언트 사용법

```typescript
import { api } from '@/lib/api';

// GET 요청
const posts = await api.get('/post/list');

// POST 요청
const result = await api.post('/member/login', {
  memberEmail: 'test@test.com',
  password: '1234'
});

// 인증이 필요한 요청
const authApi = api.withAuth(token);
const myPosts = await authApi.get('/post/my/list');
```

---

## 백엔드 API 정보

**Base URL**: `http://localhost:8080`

### 인증 (Member)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/member/send-verification-code` | 이메일 인증코드 전송 | - |
| POST | `/member/verify-email` | 이메일 인증 확인 | - |
| POST | `/member/sign` | 회원가입 (multipart) | - |
| POST | `/member/login` | 로그인 → JWT 토큰 반환 | - |
| POST | `/member/find/password` | 비밀번호 재설정 링크 전송 | - |
| POST | `/member/reset/password` | 비밀번호 재설정 | - |

### 회원 프로필

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/member/profile` | 내 프로필 조회 | JWT |
| PUT | `/member/profile` | 프로필 수정 | JWT |

### 팝업스토어 (Post)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/post/list` | 전체 팝업 목록 | - |
| GET | `/post/list/city?city={city}` | 도시별 팝업 목록 | - |
| GET | `/post/good/list` | 인기 팝업 목록 | - |
| GET | `/post/my/list` | 내가 작성한 팝업 | JWT |
| GET | `/post/detail/{id}` | 팝업 상세 조회 | - |
| GET | `/post/detail/views/{id}` | 조회수 증가 및 조회 | - |
| POST | `/post/detail/like/{id}` | 좋아요 | JWT |
| POST | `/post/detail/unlike/{id}` | 좋아요 취소 | JWT |
| GET | `/post/detail/{id}/likes` | 좋아요 수 조회 | - |
| POST | `/post/search` | 검색 (페이징) | - |
| POST | `/post/search/all` | 검색 (전체) | - |

### 팝업스토어 제보 (Information)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/information/create` | 팝업 제보 | JWT |
| GET | `/information/my/list` | 내 제보 목록 | JWT |

### 알림 (Notification)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/noti/list` | 알림 목록 | JWT |
| GET | `/noti/un-read/list` | 안읽은 알림 목록 | JWT |
| GET | `/noti/count` | 알림 개수 (total, unread) | JWT |
| PATCH | `/noti/read/{id}` | 단건 읽음 처리 | JWT |
| PATCH | `/noti/read` | 선택 읽음 처리 (body: [1,2,3]) | JWT |
| PATCH | `/noti/read/all` | 전체 읽음 처리 | JWT |

### FCM 푸시 알림

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/fcm/token` | FCM 토큰 저장 | JWT |
| POST | `/fcm/send` | 알림 발송 | - |
| POST | `/fcm/logout` | FCM 토큰 삭제 | JWT |
| GET | `/api/firebase/config` | Firebase 설정 조회 | - |

### 댓글 (Comment)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/comment/list/{postId}` | 댓글 목록 | - |
| POST | `/comment/create` | 댓글 작성 | JWT |
| PUT | `/comment/update/{id}` | 댓글 수정 | JWT |
| DELETE | `/comment/delete/{id}` | 댓글 삭제 | JWT |

### 리뷰 (Review)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/review/list/{postId}` | 리뷰 목록 | - |
| POST | `/review/create` | 리뷰 작성 | JWT |
| PUT | `/review/update/{id}` | 리뷰 수정 | JWT |
| DELETE | `/review/delete/{id}` | 리뷰 삭제 | JWT |

### 즐겨찾기 (Favorite)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/favorite/list` | 즐겨찾기 목록 | JWT |
| POST | `/favorite/add/{postId}` | 즐겨찾기 추가 | JWT |
| DELETE | `/favorite/remove/{postId}` | 즐겨찾기 삭제 | JWT |

### 팔로우 (Follow)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/follow/{memberId}` | 팔로우 | JWT |
| DELETE | `/follow/{memberId}` | 언팔로우 | JWT |
| GET | `/follow/followers` | 팔로워 목록 | JWT |
| GET | `/follow/followings` | 팔로잉 목록 | JWT |

### 공지사항 (Notice)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/notice/list` | 공지사항 목록 | - |
| GET | `/notice/detail/{id}` | 공지사항 상세 | - |

### 투표 (Poll)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/poll/list` | 투표 목록 | - |
| GET | `/poll/detail/{id}` | 투표 상세 | - |
| POST | `/poll/vote/{pollId}` | 투표하기 | JWT |

### 태그 (Tag)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/tag/list` | 태그 목록 | - |

### 헬스체크

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/health` | 서버 상태 확인 → `{ status: "UP", message: "..." }` |

## 응답 형식

모든 API는 다음 형식으로 응답합니다:

```json
{
  "httpStatus": "OK",
  "message": "성공 메시지",
  "result": { ... }
}
```

## JWT 인증

로그인 성공 시 JWT 토큰이 반환됩니다. 인증이 필요한 API 호출 시 헤더에 포함:

```
Authorization: Bearer {token}
```

## 주요 DTO 구조

### PostListDto (팝업 목록)
```typescript
interface PostListDto {
  id: number;
  title: string;
  content: string;
  postImgUrl: string;
  startDate: string;
  endDate: string;
  city: string;
  street: string;
  tags: TagDto[];
  views: number;
  likes: number;
}
```

### NotificationCountResDto (알림 개수)
```typescript
interface NotificationCountResDto {
  total: number;
  unread: number;
}
```

### SearchFilterReqDto (검색 필터)
```typescript
interface SearchFilterReqDto {
  keyword?: string;
  city?: string;
  tags?: number[];
  startDate?: string;
  endDate?: string;
  status?: 'ONGOING' | 'UPCOMING' | 'ENDED';
}
```

## 앱 출시 계획

- **웹**: Next.js → Vercel 배포
- **앱**: Capacitor로 iOS/Android 빌드 → App Store, Play Store 출시

## 권장 폴더 구조 (확장 시)

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   │   ├── login/
│   │   └── signup/
│   ├── (main)/            # 메인 페이지들
│   │   ├── page.tsx       # 홈
│   │   ├── search/
│   │   └── popup/[id]/
│   └── layout.tsx
├── components/            # 재사용 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   ├── common/           # 공통 컴포넌트
│   └── features/         # 기능별 컴포넌트
├── lib/                  # 유틸리티
│   ├── api.ts           # API 클라이언트
│   └── auth.ts          # 인증 관련
├── hooks/               # 커스텀 훅
├── types/               # TypeScript 타입 정의
└── stores/              # 상태 관리 (Zustand 등)
```
