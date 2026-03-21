import { ApiResponse } from './api';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

type QueryValue = string | number | boolean | null | undefined;
type QueryMap = Record<string, QueryValue>;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  token?: string;
  query?: QueryMap;
  data?: unknown;
  formData?: FormData;
}

function toQueryString(query?: QueryMap): string {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.set(key, String(value));
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

function buildUrl(endpoint: string, query?: QueryMap): string {
  const suffix = toQueryString(query);
  return `${API_URL}${endpoint}${suffix}`;
}

async function readResponseText(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      return JSON.parse(text);
    } catch (_error) {
      return text;
    }
  }

  return text;
}

async function request<T>(method: HttpMethod, endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {};
  let body: BodyInit | undefined;

  if (options.formData) {
    body = options.formData;
  } else if (options.data !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.data);
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(buildUrl(endpoint, options.query), {
    method,
    headers,
    body,
  });

  if (!response.ok) {
    const errorBody = await readResponseText(response);
    throw new Error(
      `API Error: ${response.status} ${response.statusText}${typeof errorBody === 'string' ? ` - ${errorBody}` : ''}`,
    );
  }

  return (await readResponseText(response)) as ApiResponse<T>;
}

const buildPostImageForm = (files: File[], descriptions?: string[]): FormData => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  if (descriptions) {
    descriptions.forEach((description) => formData.append('descriptions', description));
  }
  return formData;
};

export const qaRawApi = {
  get: <T>(endpoint: string, token?: string, query?: QueryMap) =>
    request<T>('GET', endpoint, { token, query }),

  post: <T>(endpoint: string, token?: string, data?: unknown, query?: QueryMap) =>
    request<T>('POST', endpoint, { token, data, query }),

  put: <T>(endpoint: string, token?: string, data?: unknown, query?: QueryMap) =>
    request<T>('PUT', endpoint, { token, data, query }),

  patch: <T>(endpoint: string, token?: string, data?: unknown, query?: QueryMap) =>
    request<T>('PATCH', endpoint, { token, data, query }),

  delete: <T>(endpoint: string, token?: string, data?: unknown, query?: QueryMap) =>
    request<T>('DELETE', endpoint, { token, data, query }),

  // Health
  healthCheck: () => qaRawApi.get<unknown>('/health'),
  healthCheckLegacy: () => qaRawApi.get<unknown>('/health/check'),

  // 공통 조회
  tagPopular: () => qaRawApi.get<unknown>('/tag/popular?limit=10'),
  favoriteMyCount: (token: string) => qaRawApi.get<unknown>('/favorite/my/count', token),
  favoritePostCount: (postId: number, token: string) =>
    qaRawApi.get<unknown>(`/favorite/post/${postId}/count`, token),

  // 게시글 공통/상세 비즈니스 정보
  postSearch: (filter: Record<string, unknown>, page = 0, size = 10) =>
    qaRawApi.post<unknown>('/post/search', undefined, filter, { page, size }),
  postListByDong: (dong: string) => qaRawApi.get<unknown>(`/post/list/dong?dong=${encodeURIComponent(dong)}`),
  postCreateBusinessInfo: (
    token: string,
    postId: number,
    payload: Record<string, unknown>,
  ) => qaRawApi.post<unknown>(`/post/detail/${postId}/business-info`, token, payload),
  postGetBusinessInfo: (postId: number) => qaRawApi.get<unknown>(`/post/detail/${postId}/business-info`),
  postUpdateBusinessInfo: (
    token: string,
    postId: number,
    payload: Record<string, unknown>,
  ) => qaRawApi.put<unknown>(`/post/detail/${postId}/business-info`, token, payload),
  postDeleteBusinessInfo: (token: string, postId: number) =>
    qaRawApi.delete<unknown>(`/post/detail/${postId}/business-info`, token),

  // 공지사항 타입 조회
  noticeTypeActiveAll: (noticeType: string) =>
    qaRawApi.get<unknown>(`/notice/type/${encodeURIComponent(noticeType)}/all`),
  noticeTypeActivePage: (noticeType: string, page = 0, size = 10) =>
    qaRawApi.get<unknown>(`/notice/type/${encodeURIComponent(noticeType)}`, undefined, { page, size }),

  // Q&A
  qnaGetQuestions: (postId: number, page = 0, size = 10) =>
    qaRawApi.get<unknown>(`/post/${postId}/qna/question`, undefined, { page, size }),
  qnaGetQuestionsAll: (postId: number) => qaRawApi.get<unknown>(`/post/${postId}/qna/question/all`),
  qnaGetQuestionDetail: (postId: number, questionId: number) =>
    qaRawApi.get<unknown>(`/post/${postId}/qna/question/${questionId}`),
  qnaCreateQuestion: (token: string, postId: number, content: string) =>
    qaRawApi.post<unknown>(`/post/${postId}/qna/question`, token, { content }),
  qnaDeleteQuestion: (token: string, postId: number, questionId: number) =>
    qaRawApi.delete<unknown>(`/post/${postId}/qna/question/${questionId}`, token),
  qnaCreateAnswer: (token: string, postId: number, questionId: number, content: string) =>
    qaRawApi.post<unknown>(`/post/${postId}/qna/question/${questionId}/answer`, token, { content }),
  qnaUpdateAnswer: (token: string, postId: number, answerId: number, content: string) =>
    qaRawApi.put<unknown>(`/post/${postId}/qna/answer/${answerId}`, token, { content }),
  qnaDeleteAnswer: (token: string, postId: number, answerId: number) =>
    qaRawApi.delete<unknown>(`/post/${postId}/qna/answer/${answerId}`, token),

  // 찜 폴더
  favoriteFoldersList: (token: string) => qaRawApi.get<unknown>('/favorite/folder', token),
  favoriteFoldersCreate: (token: string, name: string, description: string) =>
    qaRawApi.post<unknown>('/favorite/folder', token, { name, description }),
  favoriteFoldersUpdate: (token: string, folderId: number, name: string, description: string) =>
    qaRawApi.put<unknown>(`/favorite/folder/${folderId}`, token, { name, description }),
  favoriteFoldersDelete: (token: string, folderId: number) =>
    qaRawApi.delete<unknown>(`/favorite/folder/${folderId}`, token),
  favoriteFoldersMove: (token: string, favoriteId: number, folderId?: number) =>
    qaRawApi.put<unknown>(`/favorite/folder/move/${favoriteId}`, token, undefined, {
      folderId,
    }),

  // 히스토리
  historyViewList: (token: string) => qaRawApi.get<unknown>('/history/view', token),
  historyViewDelete: (token: string, historyId: number) => qaRawApi.delete<unknown>(`/history/view/${historyId}`, token),
  historyViewDeleteAll: (token: string) => qaRawApi.delete<unknown>('/history/view/all', token),
  historySearchList: (token: string) => qaRawApi.get<unknown>('/history/search', token),
  historySearchDelete: (token: string, historyId: number) =>
    qaRawApi.delete<unknown>(`/history/search/${historyId}`, token),
  historySearchDeleteAll: (token: string) => qaRawApi.delete<unknown>('/history/search/all', token),

  // 이미지
  postImagesUpload: (token: string, postId: number, files: File[]) =>
    request<unknown>('POST', `/post/${postId}/images`, {
      token,
      formData: buildPostImageForm(files, files.map((file, index) => `qa image ${index + 1}`)),
    }),
  postImagesList: (postId: number) => qaRawApi.get<unknown>(`/post/${postId}/images`),
  postImageDelete: (token: string, postId: number, imageId: number) =>
    qaRawApi.delete<unknown>(`/post/${postId}/images/${imageId}`, token),

  // 공유
  postShareInfo: (postId: number) => qaRawApi.get<unknown>(`/post/${postId}/share`),
  postShareInc: (postId: number) => qaRawApi.post<unknown>(`/post/${postId}/share`, undefined),

  // 알림
  notificationReadMany: (token: string, ids: number[]) => qaRawApi.patch<unknown>('/noti/read', token, ids),

  // Firebase
  firebaseConfig: () => qaRawApi.get<unknown>('/api/firebase/config'),

  // 제보
  informationMyDetail: (token: string, id: number) => qaRawApi.get<unknown>(`/info/my/detail/${id}`, token),
  informationAdminDetail: (id: number) => qaRawApi.get<unknown>(`/info/detail/${id}`),
  informationMyUpdate: (token: string, id: number, payload: Record<string, unknown>) =>
    qaRawApi.post<unknown>(`/info/my/update/${id}`, token, payload),

  reviewGetOne: (reviewId: number) => qaRawApi.get<unknown>(`/review/${reviewId}`),
  reviewPostList: (postId: number) => qaRawApi.get<unknown>(`/review/post/${postId}`),

  // 관리자 대시보드
  dashboardStats: (token: string) => qaRawApi.get<unknown>('/admin/dashboard/stats', token),
  dashboardPopularViews: (token: string, limit = 10) => qaRawApi.get<unknown>('/admin/dashboard/popular/views', token, { limit }),
  dashboardPopularLikes: (token: string, limit = 10) => qaRawApi.get<unknown>('/admin/dashboard/popular/likes', token, { limit }),
  dashboardPopularRating: (token: string, limit = 10) => qaRawApi.get<unknown>('/admin/dashboard/popular/rating', token, { limit }),
  dashboardCategoryDistribution: (token: string) => qaRawApi.get<unknown>('/admin/dashboard/category-distribution', token),
  dashboardRatingTrend: (token: string, days = 30) => qaRawApi.get<unknown>('/admin/dashboard/rating-trend', token, { days }),
};
