'use client';

import { useMemo, useState } from 'react';
import { ApiResponse, healthApi } from '@/lib/api';
import { authApi, isAdmin } from '@/lib/auth';
import { commentApi } from '@/lib/comment';
import { favoriteApi } from '@/lib/favorite';
import { followApi } from '@/lib/follow';
import { informationApi } from '@/lib/information';
import { fcmApi } from '@/lib/fcm';
import { memberApi } from '@/lib/member';
import { noticeApi } from '@/lib/notice';
import { notificationApi } from '@/lib/notification';
import { pollApi } from '@/lib/poll';
import { postApi } from '@/lib/post';
import { qaRawApi } from '@/lib/qaRawApi';
import { reviewApi } from '@/lib/review';
import { storage } from '@/lib/storage';
import { tagApi } from '@/lib/tag';
import { useToast } from '@/context/ToastContext';

type QaStatus = 'success' | 'error' | 'skipped';

type QaLog = {
  id: string;
  scope: string;
  label: string;
  status: QaStatus;
  message: string;
  durationMs: number;
  createdAt: string;
};

type QaForm = {
  token: string;
  memberEmail: string;
  postId: string;
  noticeId: string;
  pollId: string;
  pollOptionId: string;
  targetMemberId: string;
  notificationId: string;
  commentId: string;
  reviewId: string;
  infoId: string;
  qnaQuestionId: string;
  qnaAnswerId: string;
  folderId: string;
  favoriteId: string;
  postImageId: string;
};

type DictLike = Record<string, unknown>;
type QaApiResult<T> = ApiResponse<T> | T;

const ID_KEYS = [
  'id',
  'postId',
  'noticeId',
  'pollId',
  'reviewId',
  'questionId',
  'answerId',
  'memberId',
  'historyId',
  'favoriteId',
  'folderId',
  'imageId',
  'optionId',
  'shareId',
] as const;

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200';

const buttonClass =
  'rounded-xl px-4 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

function toNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toDateRange(offsetDays: number) {
  const start = new Date();
  start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
  const end = new Date(start);
  end.setDate(end.getDate() + offsetDays);
  return {
    start: `${start.toISOString().slice(0, 19).replace('T', ' ')}`,
    end: `${end.toISOString().slice(0, 19).replace('T', ' ')}`,
  };
}

function isRecord(value: unknown): value is DictLike {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatPreview(value: unknown): string {
  if (value === null || value === undefined) return 'empty';
  if (Array.isArray(value)) return `array(${value.length})`;
  if (typeof value === 'string') return value.slice(0, 120);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    if ('result' in value) {
      return formatPreview((value as DictLike).result);
    }
    const keys = Object.keys(value);
    return keys.length ? `keys: ${keys.join(', ')}` : 'object';
  }
  return 'unknown';
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return '알 수 없는 오류';
}

function makeTextFile(name: string, suffix: string) {
  const blob = new Blob([`qa-bot-${suffix} ${new Date().toISOString()}`], { type: 'text/plain' });
  return new File([blob], name, { type: 'text/plain' });
}

function toResult<T>(value: QaApiResult<T>): T {
  if (isRecord(value) && 'result' in value) {
    return (value as unknown as ApiResponse<T>).result;
  }
  return value as T;
}

function extractId(value: unknown, keys: readonly string[] = ID_KEYS): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const itemId = extractId(item, keys);
      if (itemId !== null) return itemId;
    }
    return null;
  }

  if (!isRecord(value)) return null;

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const nested = extractId(value[key], keys);
      if (nested !== null) return nested;
    }
  }

  if ('result' in value && typeof value.result !== 'undefined') {
    const nested = extractId(value.result, keys);
    if (nested !== null) return nested;
  }

  if ('content' in value && Array.isArray(value.content)) {
    const nested = extractId(value.content, keys);
    if (nested !== null) return nested;
  }

  if ('answer' in value) {
    const nested = extractId(value.answer, ['answerId', 'id']);
    if (nested !== null) return nested;
  }

  return null;
}

function getFirstId(result: unknown, keys: readonly string[]) {
  if (!Array.isArray(result)) return null;
  for (const item of result) {
    const id = extractId(item, keys);
    if (id !== null) return id;
  }
  return null;
}

export default function QABotTab({ token: initialToken }: { token: string }) {
  const { showToast } = useToast();
  const [running, setRunning] = useState(false);
  const [allowMutations, setAllowMutations] = useState(false);
  const [logs, setLogs] = useState<QaLog[]>([]);
  const [form, setForm] = useState<QaForm>({
    token: initialToken,
    memberEmail: '',
    postId: '',
    noticeId: '',
    pollId: '',
    pollOptionId: '',
    targetMemberId: '',
    notificationId: '',
    commentId: '',
    reviewId: '',
    infoId: '',
    qnaQuestionId: '',
    qnaAnswerId: '',
    folderId: '',
    favoriteId: '',
    postImageId: '',
  });

  const token = form.token.trim();
  const admin = useMemo(() => isAdmin(token), [token]);

  const patchForm = (patch: Partial<QaForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const addLog = (entry: Omit<QaLog, 'id' | 'createdAt'>) => {
    setLogs((prev) => [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
        ...entry,
      },
      ...prev,
    ]);
  };

  const runStep = async <T,>(
    scope: string,
    label: string,
    fn: () => Promise<QaApiResult<T>>,
  ): Promise<T | null> => {
    const startedAt = Date.now();
    try {
      const response = await fn();
      const result = toResult(response);
      addLog({
        scope,
        label,
        status: 'success',
        message: formatPreview(result),
        durationMs: Date.now() - startedAt,
      });
      return result as T;
    } catch (error) {
      addLog({
        scope,
        label,
        status: 'error',
        message: formatError(error),
        durationMs: Date.now() - startedAt,
      });
      return null;
    }
  };

  const runPlainStep = async <T,>(scope: string, label: string, fn: () => Promise<T>): Promise<T | null> => {
    const startedAt = Date.now();
    try {
      const result = await fn();
      addLog({
        scope,
        label,
        status: 'success',
        message: formatPreview(result),
        durationMs: Date.now() - startedAt,
      });
      return result;
    } catch (error) {
      addLog({
        scope,
        label,
        status: 'error',
        message: formatError(error),
        durationMs: Date.now() - startedAt,
      });
      return null;
    }
  };

  const skipStep = (scope: string, label: string, reason: string) => {
    addLog({
      scope,
      label,
      status: 'skipped',
      message: reason,
      durationMs: 0,
    });
  };

  const withRunLock = async (job: () => Promise<void>) => {
    if (running) return;
    setRunning(true);
    try {
      await job();
    } finally {
      setRunning(false);
    }
  };

  const hydrateContext = async () => {
    await withRunLock(async () => {
      const next = { ...form };
      let selfMemberId: number | null = null;

      const postList = await runStep('context', '팝업 목록 조회', () => postApi.getList());
      const firstPostId = getFirstId(postList, ['id']);
      if (firstPostId && !next.postId) next.postId = String(firstPostId);

      const activeNoticeList = await runStep('context', '활성 공지 조회', () => noticeApi.getActiveList());
      const firstNoticeId = getFirstId(activeNoticeList, ['noticeId']);
      if (firstNoticeId && !next.noticeId) next.noticeId = String(firstNoticeId);

      const activePolls = await runStep('context', '활성 투표 조회', () => pollApi.getActiveList());
      const firstPollId = getFirstId(activePolls, ['pollId']);
      if (firstPollId && !next.pollId) next.pollId = String(firstPollId);
      if (Array.isArray(activePolls) && activePolls.length > 0) {
        const firstOption = extractId(activePolls[0], ['options']);
        if (!next.pollOptionId && firstOption) {
          const optionId = extractId(activePolls[0], ['optionId']);
          if (optionId) next.pollOptionId = String(optionId);
        }
      }

      const postId = toNumber(next.postId);
      if (postId) {
        const detail = await runStep('context', '팝업 상세 조회(컨텍스트)', () => postApi.getDetail(postId));
        if (detail) {
          const qnaList = await runStep('context', 'Q&A 질문 목록 조회', () => qaRawApi.qnaGetQuestionsAll(postId));
          const qnaQuestionId = extractId(qnaList, ['questionId']);
          if (qnaQuestionId && !next.qnaQuestionId) {
            next.qnaQuestionId = String(qnaQuestionId);
          }

          const qnaAnswerId = extractId(qnaList, ['answerId']);
          if (qnaAnswerId && !next.qnaAnswerId) {
            next.qnaAnswerId = String(qnaAnswerId);
          }

          const images = await runStep('context', '게시글 이미지 목록 조회', () => qaRawApi.postImagesList(postId));
          const imageId = extractId(images, ['imageId', 'id']);
          if (imageId && !next.postImageId) next.postImageId = String(imageId);

          const share = await runStep('context', '공유 정보 조회', () => qaRawApi.postShareInfo(postId));
          const shareId = extractId(share, ['shareId', 'id', 'postId']);
          if (shareId && !next.infoId) next.infoId = String(shareId);

          const comments = await runStep('context', '댓글 목록 조회', () => commentApi.getList(postId));
          const firstCommentId = extractId(comments, ['id']);
          if (firstCommentId && !next.commentId) {
            next.commentId = String(firstCommentId);
          }

          const reviews = await runStep('context', '리뷰 목록 조회', () => reviewApi.getList(postId));
          const firstReviewId = extractId(reviews, ['reviewId', 'id']);
          if (firstReviewId && !next.reviewId) {
            next.reviewId = String(firstReviewId);
          }
        }

        const favList = await runStep('context', '내 찜 목록 조회(컨텍스트)', () =>
          token ? favoriteApi.getMyList(token) : Promise.reject(new Error('토큰 없음')),
        );
        const firstFavorite = getFirstId(favList, ['favoriteId']);
        if (firstFavorite && !next.favoriteId) next.favoriteId = String(firstFavorite);

        const folderList = await runStep('context', '찜 폴더 목록 조회', () =>
          token ? qaRawApi.favoriteFoldersList(token) : Promise.reject(new Error('토큰 없음')),
        );
        const folderId = getFirstId(folderList, ['folderId']);
        if (folderId && !next.folderId) next.folderId = String(folderId);
      }

      if (token) {
        const profile = await runStep('context', '내 프로필 조회', () => memberApi.getProfile(token));
        if (profile && isRecord(profile) && typeof profile.memberEmail === 'string' && !next.memberEmail) {
          next.memberEmail = profile.memberEmail;
        }

        const notiRes = await runStep('context', '알림 목록 조회', () => notificationApi.getList(token));
        const firstNotificationId = extractId(notiRes, ['id']);
        if (firstNotificationId && !next.notificationId) next.notificationId = String(firstNotificationId);

        const myInfos = await runStep('context', '내 제보 목록 조회', () => informationApi.getMyList(token));
        const myFirstInfoId = extractId(myInfos, ['id']);
        if (myFirstInfoId && !next.infoId) next.infoId = String(myFirstInfoId);

        const likedPosts = await runStep('context', '좋아요한 팝업 조회', () => postApi.getLikedList(token));
        const likePostId = extractId(likedPosts, ['id']);
        if (likePostId && !next.postId) next.postId = String(likePostId);

        selfMemberId = extractId(profile, ['id']);
        if (admin && selfMemberId) {
          const memberList = await runStep('context', '회원 목록 조회(관리자)', () => memberApi.adminGetList(token));
          const memberItems = isRecord(memberList) && Array.isArray(memberList.content) ? memberList.content : [];
          if (Array.isArray(memberItems)) {
            for (const item of memberItems) {
              const foundMemberId = extractId(item, ['id', 'memberId']);
              if (foundMemberId && foundMemberId !== selfMemberId && !next.targetMemberId) {
                next.targetMemberId = String(foundMemberId);
                break;
              }
            }
          }
        }
      }

      const noticeTypeNormal = await runStep('context', '공지 타입 조회', () => qaRawApi.noticeTypeActiveAll('NORMAL'));
      const normalNotice = getFirstId(noticeTypeNormal, ['noticeId']);
      if (normalNotice && !next.noticeId) next.noticeId = String(normalNotice);

      if (selfMemberId) {
        const followerStats = await runStep('context', '팔로우 통계 조회(시드)', () => followApi.getStats(selfMemberId));
        const memberStatId = extractId(followerStats, ['memberId']);
        if (memberStatId && !next.targetMemberId) next.targetMemberId = String(memberStatId);
      } else {
        skipStep('context', '팔로우 통계 조회(시드)', '프로필 정보가 없어 건너뜁니다');
      }

      setForm(next);
      showToast('QA 컨텍스트를 갱신했습니다.', 'success');
    });
  };

  const runReadOnlySmoke = async () => {
    await withRunLock(async () => {
      const postId = toNumber(form.postId);
      const noticeId = toNumber(form.noticeId);
      const pollId = toNumber(form.pollId);
      const targetMemberId = toNumber(form.targetMemberId);
      const qnaQuestionId = toNumber(form.qnaQuestionId);

      await runStep('core', '헬스체크', () => healthApi.check());
      await runStep('core', '레거시 헬스체크', () => qaRawApi.healthCheckLegacy());

      await runStep('core', '전체 팝업 조회', () => postApi.getList());
      await runStep('core', '인기 팝업 조회', () => postApi.getPopularList());
          await runStep('core', '도시별 팝업 조회', () => postApi.getListByCity('서울특별시'));
          await runStep('core', '동별 팝업 조회', () => qaRawApi.postListByDong('역삼동'));
      await runStep('core', '태그 목록 조회', () => tagApi.getList());
      await runStep('core', '인기 태그 조회', () => tagApi.getPopular());

      await runStep('notice', '활성 공지 전체 조회', () => noticeApi.getActiveList());
      await runStep('notice', '팝업 공지 조회', () => noticeApi.getPopupNotices());
      await runStep('notice', '공지 타입 조회(NORMAL)', () => qaRawApi.noticeTypeActiveAll('NORMAL'));
      await runStep('notice', '공지 타입 조회(IMPORTANT)', () => qaRawApi.noticeTypeActiveAll('IMPORTANT'));
      await runStep('notice', '공지 타입 조회(POPUP)', () => qaRawApi.noticeTypeActiveAll('POPUP'));

      await runStep('poll', '활성 투표 조회', () => pollApi.getActiveList());

      if (postId) {
        const detail = await runStep('post', '팝업 상세 조회', () => postApi.getDetail(postId));
        await runStep('post', '조회수 증가', () => postApi.incrementViews(postId));
        await runStep('post', '좋아요 수 조회', () => postApi.getLikes(postId));
        await runStep('post', '좋아요 여부 조회(요청 사용자)', () => favoriteApi.check(postId, token || 'dummy'));
        await runStep('comment', '댓글 목록 조회', () => commentApi.getList(postId));

        await runStep('review', '포스트 리뷰 페이지 조회', () => qaRawApi.reviewPostList(postId));
        const reviewList = await runStep('review', '리뷰 목록 조회(전체)', () => reviewApi.getList(postId));
        const reviewId = getFirstId(reviewList, ['reviewId', 'id']);
        if (reviewId) {
          await runStep('review', '리뷰 단건 조회', () => qaRawApi.reviewGetOne(reviewId));
        }

        await runStep('qa', 'Q&A 질문 목록 조회(전체)', () => qaRawApi.qnaGetQuestionsAll(postId));
        if (qnaQuestionId) {
          await runStep('qa', 'Q&A 질문 상세 조회', () => qaRawApi.qnaGetQuestionDetail(postId, qnaQuestionId));
        }
        await runStep('post', '비즈니스 정보 조회', () => qaRawApi.postGetBusinessInfo(postId));
        await runStep('post', '게시글 이미지 조회', () => qaRawApi.postImagesList(postId));
        await runStep('post', '공유 정보 조회', () => qaRawApi.postShareInfo(postId));

        await runStep('post', '검색(POST /search, 페이징 포함)', () => qaRawApi.postSearch({ keyword: '테스트' }, 0, 5));
        await runStep('post', '검색 전체(POST /search/all)', () => postApi.searchAll({ keyword: '테스트' }));

        await runStep('post', '검색 조회 by city+dong', () => postApi.searchAll({ city: '서울특별시', dong: '역삼동' }));

        if (detail && isRecord(detail) && 'city' in detail && typeof detail.city === 'string') {
          await runStep('post', '도시로 팝업 재조회', () => postApi.getListByCity(detail.city));
        }
      }

      if (noticeId) {
        await runStep('notice', '공지 상세 조회', () => noticeApi.getDetail(noticeId));
      }

      if (pollId) {
        await runStep('poll', '투표 상세 조회', () => pollApi.getDetail(pollId));
      }

      if (targetMemberId) {
        await runStep('follow', '특정 회원 팔로워 조회', () => followApi.getFollowers(targetMemberId));
        await runStep('follow', '특정 회원 팔로잉 조회', () => followApi.getFollowings(targetMemberId));
        await runStep('follow', '특정 회원 팔로우 통계 조회', () => followApi.getStats(targetMemberId));
      }

      await runStep('favorite', '찜 개수 조회', () => token ? qaRawApi.favoriteMyCount(token) : Promise.reject(new Error('토큰 없음')));
      if (postId) {
        await runStep('favorite', '게시글별 찜 개수 조회', () =>
          token ? qaRawApi.favoritePostCount(postId, token) : Promise.reject(new Error('토큰 없음')),
        );
      }

      if (token) {
        await runStep('auth', '로그인 실패 케이스', () => authApi.login({ memberEmail: 'qa@example.com', password: 'invalid-password' }));
        await runStep('member', '내 프로필 조회', () => memberApi.getProfile(token));
        await runStep('post', '내 팝업 목록 조회', () => postApi.getMyList(token));
        await runStep('post', '좋아요한 팝업 조회', () => postApi.getLikedList(token));
        await runStep('favorite', '내 찜 목록 조회', () => favoriteApi.getMyList(token));
        await runStep('follow', '내 팔로워 수 조회', () => followApi.getMyStats(token));
        await runStep('follow', '내 팔로워 목록 조회', () => followApi.getMyFollowers(token));
        await runStep('follow', '내 팔로잉 목록 조회', () => followApi.getMyFollowings(token));
        await runStep('notification', '알림 개수 조회', () => notificationApi.getCount(token));
        await runStep('notification', '알림 목록 조회', () => notificationApi.getList(token));
        await runStep('notification', '미확인 알림 목록 조회', () => notificationApi.getUnreadList(token));
        await runStep('poll', '내 투표 목록 조회', () => pollApi.getMyVotes(token));
        await runStep('review', '내 리뷰 목록 조회', () => reviewApi.getMyList(token));
        await runStep('info', '내 제보 목록 조회', () => informationApi.getMyList(token));
        await runStep('history', '조회 히스토리 조회', () => qaRawApi.historyViewList(token));
        await runStep('history', '검색 히스토리 조회', () => qaRawApi.historySearchList(token));
        await runStep('folder', '찜 폴더 목록 조회', () => qaRawApi.favoriteFoldersList(token));
        await runStep('config', 'Firebase Config 조회', () => qaRawApi.firebaseConfig());

        if (admin) {
          await runStep('admin', '관리자 회원 목록 조회', () => memberApi.adminGetList(token));
          await runStep('admin', '관리자 공지 목록 조회', () => noticeApi.adminGetList(token));
          await runStep('admin', '관리자 제보 목록 조회', () => informationApi.adminGetList(token));
          await runStep('admin', '관리자 투표 목록 조회', () => pollApi.adminGetList(token));
          await runStep('admin-dashboard', '대시보드 통계 조회', () => qaRawApi.dashboardStats(token));
          await runStep('admin-dashboard', '인기 팝업 조회(조회수)', () => qaRawApi.dashboardPopularViews(token, 3));
          await runStep('admin-dashboard', '인기 팝업 조회(좋아요)', () => qaRawApi.dashboardPopularLikes(token, 3));
          await runStep('admin-dashboard', '인기 팝업 조회(평점)', () => qaRawApi.dashboardPopularRating(token, 3));
          await runStep('admin-dashboard', '카테고리 분포 조회', () => qaRawApi.dashboardCategoryDistribution(token));
          await runStep('admin-dashboard', '평점 트렌드 조회', () => qaRawApi.dashboardRatingTrend(token, 7));
        }

      } else {
        skipStep('auth', '인증 API', '토큰이 없어 인증 계열은 건너뜀');
      }

      showToast('읽기 전용 스모크 테스트를 완료했습니다.', 'success');
    });
  };

  const runMutationSmoke = async () => {
    await withRunLock(async () => {
      if (!allowMutations) {
        showToast('변경 테스트 토글을 먼저 켜야 합니다.', 'error');
        return;
      }

      if (!token) {
        showToast('토큰이 없어 변경 테스트를 실행할 수 없습니다.', 'error');
        return;
      }

      const postId = toNumber(form.postId);
      const targetMemberId = toNumber(form.targetMemberId);
      const pollId = toNumber(form.pollId);
      const pollOptionId = toNumber(form.pollOptionId);
      const notificationId = toNumber(form.notificationId);
      const qnaQuestionId = toNumber(form.qnaQuestionId);
      const qnaAnswerId = toNumber(form.qnaAnswerId);
      const reviewId = toNumber(form.reviewId);
      const folderId = toNumber(form.folderId);

      if (postId) {
        await runStep('mutation', '좋아요 추가', () => postApi.like(postId, token));
        await runStep('mutation', '좋아요 취소', () => postApi.unlike(postId, token));
        await runStep('mutation', '찜 추가', () => favoriteApi.add(postId, token));
        await runStep('mutation', '찜 확인', () => favoriteApi.check(postId, token));
        await runStep('mutation', '찜 제거', () => favoriteApi.remove(postId, token));

        const commentSuffix = Date.now();
        const commentCreated = await runStep('mutation', '댓글 생성', () =>
          commentApi.create({ postId, content: `[QA] 자동 댓글 ${commentSuffix}` }, token),
        );
        const createdCommentId = extractId(commentCreated, ['id']);
        if (createdCommentId) {
          await runStep('mutation', '댓글 수정', () =>
            commentApi.update({ id: createdCommentId, postId, content: `[QA] 수정 댓글 ${commentSuffix}` }, token),
          );

          const reply = await runStep('mutation', '답글 생성', () =>
            commentApi.reply(
              { postId, parentId: createdCommentId, content: `[QA] 답글 ${commentSuffix}` },
              token,
            ),
          );
          const replyId = extractId(reply, ['id']);
          if (replyId) {
            await runStep('mutation', '답글 삭제', () => commentApi.delete(replyId, token));
          }

          await runStep('mutation', '댓글 삭제', () => commentApi.delete(createdCommentId, token));
        }

        const reviewSuffix = Date.now();
        const createdReview = await runStep('mutation', '리뷰 생성', () =>
          reviewApi.create(
            postId,
            {
              content: `[QA] 자동 리뷰 ${reviewSuffix}`,
              satisfaction: 5,
              waitingTime: 10,
              photoAvailability: 1,
            },
            token,
          ),
        );
        const createdReviewId = extractId(createdReview, ['reviewId', 'id']);
        if (createdReviewId) {
          await runStep('mutation', '리뷰 수정', () =>
            reviewApi.update(
              createdReviewId,
              {
                content: `[QA] 수정 리뷰 ${reviewSuffix}`,
                satisfaction: 4,
                waitingTime: 12,
                photoAvailability: 2,
              },
              token,
            ),
          );
          await runStep('mutation', '리뷰 삭제', () => reviewApi.delete(createdReviewId, token));
        }

        const imageFiles = [
          makeTextFile(`qa-post-${postId}-1.txt`, `${postId}-a`),
          makeTextFile(`qa-post-${postId}-2.txt`, `${postId}-b`),
        ];
        const uploadedImages = await runStep('mutation', '이미지 업로드', () => qaRawApi.postImagesUpload(token, postId, imageFiles));
        const uploadedImageId = extractId(uploadedImages, ['imageId', 'id']);
        if (uploadedImageId) {
          await runStep('mutation', '이미지 삭제', () => qaRawApi.postImageDelete(token, postId, uploadedImageId));
        } else {
          skipStep('mutation', '이미지 삭제', '이미지 ID를 받지 못해 건너뜀');
        }

        const businessPayload = {
          operatingHours: {
            MONDAY: { open: '10:00', close: '18:00', closed: false },
            TUESDAY: { open: '10:00', close: '18:00', closed: false },
          },
          dayOff: '월',
          entryFee: '무료',
          parkingAvailable: true,
          parkingFee: '3000',
          nearbySubway: '강남',
          nearbySubwayExit: '1번 출구',
        };

        const bizCreated = await runStep('mutation', '비즈니스정보 생성', () =>
          qaRawApi.postCreateBusinessInfo(token, postId, businessPayload),
        );
        const bizUpdated = await runStep('mutation', '비즈니스정보 수정', () =>
          qaRawApi.postUpdateBusinessInfo(token, postId, { ...businessPayload, parkingFee: '4000' }),
        );
        if (bizCreated || bizUpdated) {
          await runStep('mutation', '비즈니스정보 삭제', () => qaRawApi.postDeleteBusinessInfo(token, postId));
        }

        const qnaQuestion = qnaQuestionId
          ? await runStep('mutation', 'Q&A 질문 상세 조회(사전 준비)', () => qaRawApi.qnaGetQuestionDetail(postId, qnaQuestionId))
          : await runStep('mutation', 'Q&A 질문 생성', () => qaRawApi.qnaCreateQuestion(token, postId, `[QA] 질문 ${Date.now()}`));

        const qnaTargetQuestionId = extractId(qnaQuestion, ['questionId', 'id']) ?? qnaQuestionId;
        if (qnaTargetQuestionId) {
          const answer = await runStep('mutation', 'Q&A 답변 생성', () =>
            qaRawApi.qnaCreateAnswer(token, postId, qnaTargetQuestionId, `[QA] 답변 ${Date.now()}`),
          );
          const answerId = extractId(answer, ['answerId', 'id']) ?? qnaAnswerId;
          if (answerId) {
            await runStep('mutation', 'Q&A 답변 수정', () =>
              qaRawApi.qnaUpdateAnswer(token, postId, answerId, `[QA] 답변 수정 ${Date.now()}`),
            );
            await runStep('mutation', 'Q&A 답변 삭제', () =>
              qaRawApi.qnaDeleteAnswer(token, postId, answerId),
            );
          } else {
            skipStep('mutation', 'Q&A 답변 후속', 'answerId를 받지 못해 건너뜀');
          }
          await runStep('mutation', 'Q&A 질문 삭제', () => qaRawApi.qnaDeleteQuestion(token, postId, qnaTargetQuestionId));
        }
      } else {
        skipStep('mutation', '팝업 기반 쓰기 테스트', 'postId가 없어 건너뜀');
      }

      if (targetMemberId && targetMemberId !== 0) {
        await runStep('mutation', '팔로우 추가', () => followApi.follow(targetMemberId, token));
        await runStep('mutation', '팔로우 확인', () => followApi.check(targetMemberId, token));
        await runStep('mutation', '팔로우 해제', () => followApi.unfollow(targetMemberId, token));
      } else {
        skipStep('mutation', '팔로우 테스트', 'targetMemberId가 없어 건너뜀');
      }

      if (notificationId) {
        await runStep('mutation', '알림 1건 읽음 처리', () => notificationApi.markAsRead(token, notificationId));
      } else {
        skipStep('mutation', '알림 읽음 처리', 'notificationId가 없어 건너뜀');
      }

      if (pollId && pollOptionId) {
        await runStep('mutation', '투표 참여', () => pollApi.vote(pollId, [pollOptionId], token));
      } else {
        skipStep('mutation', '투표 참여', 'pollId/pollOptionId가 없어 건너뜀');
      }

      const viewHistory = await runStep('mutation', '조회 히스토리 조회', () => qaRawApi.historyViewList(token));
      const viewHistoryId = extractId(viewHistory, ['historyId', 'id']);
      if (viewHistoryId) {
        await runStep('mutation', '조회 히스토리 삭제', () => qaRawApi.historyViewDelete(token, viewHistoryId));
      } else {
        skipStep('mutation', '조회 히스토리 삭제', '삭제할 대상이 없어 건너뜀');
      }
      await runStep('mutation', '조회 히스토리 전체 삭제', () => qaRawApi.historyViewDeleteAll(token));

      const searchHistory = await runStep('mutation', '검색 히스토리 조회', () => qaRawApi.historySearchList(token));
      const searchHistoryId = extractId(searchHistory, ['historyId', 'id']);
      if (searchHistoryId) {
        await runStep('mutation', '검색 히스토리 삭제', () => qaRawApi.historySearchDelete(token, searchHistoryId));
      } else {
        skipStep('mutation', '검색 히스토리 삭제', '삭제할 대상이 없어 건너뜀');
      }
      await runStep('mutation', '검색 히스토리 전체 삭제', () => qaRawApi.historySearchDeleteAll(token));

      await runStep('mutation', 'FCM 토큰 저장', () => fcmApi.saveToken(token, `qa-bot-token-${Date.now()}`));
      await runStep('mutation', 'FCM 토큰 삭제', () => fcmApi.logout(token));

      if (reviewId) {
        await runStep('manual', '리뷰 강제 삭제(지정)', () => reviewApi.delete(reviewId, token));
      }

      const myFavorites = await runStep('mutation', '내 찜 목록 조회', () => favoriteApi.getMyList(token));
      const myFavoriteId = toNumber(form.favoriteId) ?? extractId(myFavorites, ['favoriteId']);
      if (myFavoriteId) {
        const folders = await runStep('mutation', '찜 폴더 목록 조회', () => qaRawApi.favoriteFoldersList(token));
        const selectedFolderId = folderId ?? extractId(folders, ['folderId']);
        if (selectedFolderId) {
          await runStep('mutation', '찜 폴더 이동', () => qaRawApi.favoriteFoldersMove(token, myFavoriteId, selectedFolderId));
        } else {
          skipStep('mutation', '찜 폴더 이동', '폴더 ID가 없어 건너뜀');
        }
      } else {
        skipStep('mutation', '찜 폴더 이동', 'favoriteId가 없어 건너뜀');
      }

      if (admin) {
        const range = toDateRange(2);

        const createdNotice = await runStep('mutation', '공지 생성', () =>
          noticeApi.adminCreate(token, {
            title: `[QA] 공지 ${Date.now()}`,
            content: '자동 QA 테스트 공지입니다.',
            noticeType: 'NORMAL',
            startDate: range.start,
            endDate: range.end,
          }),
        );
        const createdNoticeId = extractId(createdNotice, ['noticeId', 'id']);
        if (createdNoticeId) {
          await runStep('mutation', '공지 수정', () =>
            noticeApi.adminUpdate(createdNoticeId, token, {
              title: `[QA] 공지 수정 ${Date.now()}`,
              content: '자동 QA 테스트 공지 수정',
            }),
          );
          await runStep('mutation', '공지 삭제', () => noticeApi.adminDelete(createdNoticeId, token));
        } else {
          skipStep('mutation', '공지 후속 테스트', 'noticeId를 받지 못해 건너뜀');
        }

        const createdPoll = await runStep('mutation', '투표 생성', () =>
          pollApi.adminCreate(token, {
            title: `[QA] 투표 ${Date.now()}`,
            description: '자동 QA 테스트 투표',
            startDate: range.start,
            endDate: range.end,
            multipleChoice: false,
          }),
        );
        const createdPollId = extractId(createdPoll, ['pollId', 'id']);
        if (createdPollId) {
          const optionAdd = await runStep('mutation', '투표 옵션 추가', () =>
            pollApi.adminAddOption(createdPollId, token, { description: `QA option ${Date.now()}` }),
          );
          const optionId = extractId(optionAdd, ['optionId', 'id']);
          if (optionId) {
            await runStep('mutation', '투표 옵션 삭제', () => pollApi.adminDeleteOption(optionId, token));
          } else {
            skipStep('mutation', '투표 옵션 삭제', 'optionId를 받지 못해 건너뜀');
          }
          await runStep('mutation', '투표 수정', () =>
            pollApi.adminUpdate(createdPollId, token, { title: `[QA] 투표 수정 ${Date.now()}` }),
          );
          await runStep('mutation', '투표 삭제', () => pollApi.adminDelete(createdPollId, token));
        } else {
          skipStep('mutation', '투표 후속 테스트', 'pollId를 받지 못해 건너뜀');
        }

        const createdPost = await runStep('mutation', '팝업 생성', () =>
          postApi.create(
            token,
            {
              memberEmail: form.memberEmail || 'qa@example.com',
              title: `[QA] 팝업 ${Date.now()}`,
              content: '자동 QA 테스트용 팝업입니다.',
              startDate: range.start,
              endDate: range.end,
              city: '서울특별시',
              dong: '역삼동',
              street: '테헤란로 1',
              zipcode: '06236',
              detailAddress: 'QA BOT',
              category: 'ETC',
              tagNames: ['qa-bot'],
            },
            undefined,
          ),
        );
        const createdPostId = extractId(createdPost, ['id', 'postId']);
        if (createdPostId) {
          await runStep('mutation', '팝업 수정', () => postApi.update(createdPostId, token, { title: `[QA] 팝업 수정 ${Date.now()}` }));
          await runStep('mutation', '팝업 삭제', () => postApi.delete(createdPostId, token));
        } else {
          skipStep('mutation', '팝업 후속 테스트', 'postId를 받지 못해 건너뜀');
        }

        const createdFolder = await runStep('mutation', '찜 폴더 생성', () =>
          qaRawApi.favoriteFoldersCreate(token, `qa-folder-${Date.now()}`, 'QA 자동 생성 폴더'),
        );
        const createdFolderId = extractId(createdFolder, ['folderId', 'id']);
        if (createdFolderId) {
          await runStep('mutation', '찜 폴더 수정', () =>
            qaRawApi.favoriteFoldersUpdate(token, createdFolderId, `qa-folder-${Date.now()}`, '수정됨'),
          );
          await runStep('mutation', '찜 폴더 삭제', () => qaRawApi.favoriteFoldersDelete(token, createdFolderId));
        } else {
          skipStep('mutation', '찜 폴더 후속', 'folderId를 받지 못해 건너뜀');
        }

        const createdInfo = await runStep('mutation', '제보 생성', () =>
          informationApi.create(token, {
            title: `[QA] 제보 ${Date.now()}`,
            content: '자동 QA 테스트 제보입니다.',
            startDate: range.start,
            endDate: range.end,
            phoneNumber: '01012345678',
            city: '서울특별시',
            dong: '역삼동',
            street: '테헤란로 1',
            zipcode: '06236',
            detailAddress: 'QA BOT',
            category: 'ETC',
            tagNames: ['qa-bot'],
          }),
        );
        const createdInfoId = extractId(createdInfo, ['id']);
        if (createdInfoId) {
          await runStep('mutation', '제보 상세 조회(관리자)', () => qaRawApi.informationAdminDetail(createdInfoId));
          await runStep('mutation', '제보 삭제', () => informationApi.adminDelete(createdInfoId, token));
        } else {
          skipStep('mutation', '제보 후속 테스트', 'id를 받지 못해 건너뜀');
        }
      } else {
        skipStep('mutation', '관리자 쓰기 테스트', 'admin token이 아니어서 건너뜀');
      }

      showToast('변경 테스트를 완료했습니다.', 'success');
    });
  };

  const runStorageSmoke = async () => {
    await withRunLock(async () => {
      await runPlainStep('manual', 'localStorage 저장/조회/삭제', async () => {
        const key = 'qa-bot-storage-key';
        const value = `qa-bot-${Date.now()}`;
        await storage.set(key, value);
        const loaded = await storage.get(key);
        await storage.remove(key);
        const removed = await storage.get(key);
        return {
          stored: value,
          loaded,
          removed: removed ?? null,
          ok: loaded === value && removed === null,
        };
      });
      showToast('localStorage 수명주기 테스트를 완료했습니다.', 'success');
    });
  };

  const runManualAction = async (label: string, fn: () => Promise<QaApiResult<unknown>>) => {
    await withRunLock(async () => {
      const result = await runStep('manual', label, fn);
      if (result) {
        showToast(`${label} 실행 완료`, 'success');
      }
    });
  };

  const runRawAuthSuite = async () => {
    await withRunLock(async () => {
      await runStep('manual', '인증코드 발송', () => authApi.sendVerificationCode(form.memberEmail || 'qa@example.com'));
      await runStep('manual', '인증코드 검증', () => authApi.verifyEmail(form.memberEmail || 'qa@example.com', '000000'));
      await runStep('manual', '비밀번호 찾기 요청', () => authApi.findPassword(form.memberEmail || 'qa@example.com'));
      await runStep('manual', '비밀번호 재설정 요청', () => authApi.resetPassword('qa-reset-token', 'pass1234', 'pass1234'));
      showToast('인증 관련 수동 동작을 완료했습니다.', 'success');
    });
  };

  const statusClass: Record<QaStatus, string> = {
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    skipped: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-gray-900">QA 봇</p>
            <p className="mt-1 text-sm text-gray-500">백엔드/프론트 핵심 엔드포인트를 한 번에 점검하는 테스트 패널</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
            <span className="text-xs font-medium text-gray-500">쓰기 테스트</span>
            <button
              type="button"
              onClick={() => setAllowMutations((prev) => !prev)}
              className={`relative h-6 w-11 rounded-full transition-colors ${allowMutations ? 'bg-gray-900' : 'bg-gray-200'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  allowMutations ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">테스트 토큰</label>
            <textarea
              rows={3}
              value={form.token}
              onChange={(e) => patchForm({ token: e.target.value })}
              className={`${inputClass} resize-none`}
              placeholder="Bearer 토큰 없이 JWT만 입력"
            />
          </div>

          <label className="text-xs font-medium text-gray-500">
            memberEmail
            <input
              value={form.memberEmail}
              onChange={(e) => patchForm({ memberEmail: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            postId
            <input
              value={form.postId}
              onChange={(e) => patchForm({ postId: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            noticeId
            <input
              value={form.noticeId}
              onChange={(e) => patchForm({ noticeId: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            pollId
            <input
              value={form.pollId}
              onChange={(e) => patchForm({ pollId: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            pollOptionId
            <input
              value={form.pollOptionId}
              onChange={(e) => patchForm({ pollOptionId: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            targetMemberId
            <input
              value={form.targetMemberId}
              onChange={(e) => patchForm({ targetMemberId: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            notificationId
            <input
              value={form.notificationId}
              onChange={(e) => patchForm({ notificationId: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            commentId
            <input
              value={form.commentId}
              onChange={(e) => patchForm({ commentId: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            reviewId
            <input
              value={form.reviewId}
              onChange={(e) => patchForm({ reviewId: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            infoId
            <input
              value={form.infoId}
              onChange={(e) => patchForm({ infoId: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            qnaQuestionId
            <input
              value={form.qnaQuestionId}
              onChange={(e) => patchForm({ qnaQuestionId: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            qnaAnswerId
            <input
              value={form.qnaAnswerId}
              onChange={(e) => patchForm({ qnaAnswerId: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            folderId
            <input
              value={form.folderId}
              onChange={(e) => patchForm({ folderId: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            favoriteId
            <input
              value={form.favoriteId}
              onChange={(e) => patchForm({ favoriteId: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            postImageId
            <input
              value={form.postImageId}
              onChange={(e) => patchForm({ postImageId: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={hydrateContext}
            disabled={running}
            className={`${buttonClass} bg-gray-900 text-white hover:bg-gray-800`}
          >
            컨텍스트 자동 수집
          </button>
          <button
            type="button"
            onClick={runReadOnlySmoke}
            disabled={running}
            className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
          >
            읽기 전용 스모크
          </button>
          <button
            type="button"
            onClick={runMutationSmoke}
            disabled={running || !allowMutations}
            className={`${buttonClass} bg-red-500 text-white hover:bg-red-600`}
          >
            쓰기 테스트 실행
          </button>
          <button
            type="button"
            onClick={runRawAuthSuite}
            disabled={running}
            className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
          >
            인증 API 수동 실행
          </button>
          <button
            type="button"
            onClick={() => setLogs([])}
            disabled={running || logs.length === 0}
            className={`${buttonClass} bg-white text-gray-500 hover:bg-gray-50`}
          >
            로그 비우기
          </button>
          <button
            type="button"
            onClick={runStorageSmoke}
            disabled={running}
            className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
          >
            localStorage 확인
          </button>
        </div>

        <div className="mt-3 rounded-2xl bg-white/80 p-4 text-xs text-gray-500">
          <p>현재 토큰 권한: {token ? (admin ? '관리자' : '일반 사용자') : '미입력'}</p>
          <p className="mt-1">권장: 컨텍스트 자동 수집 → 읽기 전용 → 쓰기 순으로 실행하세요.</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-gray-900">수동 액션</p>
          <p className="mt-1 text-xs text-gray-500">자동 스위트 바깥의 개별 변경 API를 실행합니다.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={running || !token}
              onClick={() =>
                runManualAction('알림 전체 읽음', () => notificationApi.markAllAsRead(token))
              }
              className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              알림 전체 읽음
            </button>
            <button
              type="button"
              disabled={running || !token || !admin || !toNumber(form.infoId)}
              onClick={() =>
                runManualAction('제보 승인', () => informationApi.adminConvert(Number(form.infoId), token))
              }
              className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              제보 승인
            </button>
            <button
              type="button"
              disabled={running || !token || !admin || !toNumber(form.infoId)}
              onClick={() =>
                runManualAction('제보 반려', () => informationApi.adminReject(Number(form.infoId), token))
              }
              className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              제보 반려
            </button>
            <button
              type="button"
              disabled={running || !token || !admin || !toNumber(form.infoId)}
              onClick={() =>
                runManualAction('승인 취소', () => informationApi.adminCancelApproval(Number(form.infoId), token))
              }
              className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              승인 취소
            </button>
            <button
              type="button"
              disabled={running || !token || !admin || !toNumber(form.infoId)}
              onClick={() =>
                runManualAction('제보 삭제', () => informationApi.adminDelete(Number(form.infoId), token))
              }
              className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              제보 삭제
            </button>
            <button
              type="button"
              disabled={running}
              onClick={() =>
                runManualAction('인증코드 발송', () => authApi.sendVerificationCode(form.memberEmail || 'qa@example.com'))
              }
              className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              인증코드 발송
            </button>
            <button
              type="button"
              disabled={running}
              onClick={() =>
                runManualAction('Firebase 설정 조회', () => qaRawApi.firebaseConfig())
              }
              className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              Firebase 설정 조회
            </button>
            <button
              type="button"
              disabled={running || !token || !admin || !toNumber(form.folderId)}
              onClick={() =>
                runManualAction('폴더 삭제(지정)', () => qaRawApi.favoriteFoldersDelete(token, Number(form.folderId)))
              }
              className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              폴더 삭제(지정)
            </button>
            <button
              type="button"
              disabled={running || !token || !admin || !toNumber(form.postImageId) || !toNumber(form.postId)}
              onClick={() =>
                runManualAction('이미지 삭제(지정)', () =>
                  qaRawApi.postImageDelete(token, Number(form.postId), Number(form.postImageId)),
                )
              }
              className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              이미지 삭제(지정)
            </button>
            <button
              type="button"
              disabled={running || !token || !toNumber(form.commentId) || !toNumber(form.postId)}
              onClick={() =>
                runManualAction('특정 댓글 삭제', () =>
                  commentApi.delete(Number(form.commentId), token),
                )
              }
              className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              댓글 삭제(지정)
            </button>
            <button
              type="button"
              disabled={running || !token || !toNumber(form.reviewId)}
              onClick={() =>
                runManualAction('리뷰 삭제(지정)', () => reviewApi.delete(Number(form.reviewId), token))
              }
              className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              리뷰 삭제(지정)
            </button>
            <button
              type="button"
              disabled={running || !admin || !token || !toNumber(form.noticeId)}
              onClick={() =>
                runManualAction('공지 삭제(지정)', () => noticeApi.adminDelete(Number(form.noticeId), token))
              }
              className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              공지 삭제(지정)
            </button>
            <button
              type="button"
              disabled={running || !admin || !token || !toNumber(form.pollId)}
              onClick={() =>
                runManualAction('투표 삭제(지정)', () => pollApi.adminDelete(Number(form.pollId), token))
              }
              className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              투표 삭제(지정)
            </button>
            <button
              type="button"
              disabled={running || !admin || !token || !toNumber(form.postId)}
              onClick={() =>
                runManualAction('팝업 삭제(지정)', () => postApi.delete(Number(form.postId), token))
              }
              className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              팝업 삭제(지정)
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-gray-900">로그</p>
          <p className="mt-1 text-xs text-gray-500">최근 실행이 위에 표시됩니다.</p>
          <div className="mt-4 max-h-[420px] space-y-2 overflow-auto pr-1">
            {logs.length === 0 ? (
              <p className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
                아직 실행 기록이 없습니다.
              </p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{log.scope}</p>
                      <p className="truncate text-sm font-medium text-gray-900">{log.label}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass[log.status]}`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="mt-2 break-words text-xs text-gray-500">{log.message}</p>
                  <p className="mt-2 text-[11px] text-gray-400">
                    {log.createdAt} · {log.durationMs}ms
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
