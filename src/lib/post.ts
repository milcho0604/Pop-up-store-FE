import { api, ApiResponse } from './api';
import { PostListDto, PostDetailDto, SearchFilterReqDto, PostCreateReqDto } from '@/types/post';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const postApi = {
  // 인기 팝업 목록 조회
  getPopularList: () =>
    api.get<ApiResponse<PostListDto[]>>('/post/good/list'),

  // 전체 팝업 목록 조회
  getList: () =>
    api.get<ApiResponse<PostListDto[]>>('/post/list'),

  // 팝업 상세 조회
  getDetail: (id: number) =>
    api.get<ApiResponse<PostDetailDto>>(`/post/detail/${id}`),

  // 조회수 증가 및 조회
  incrementViews: (id: number) =>
    api.get<ApiResponse<number>>(`/post/detail/views/${id}`),

  // 좋아요
  like: (id: number, token: string) =>
    api.withAuth(token).post<ApiResponse<number>>(`/post/detail/like/${id}`),

  // 좋아요 취소
  unlike: (id: number, token: string) =>
    api.withAuth(token).post<ApiResponse<number>>(`/post/detail/unlike/${id}`),

  // 좋아요 수 조회
  getLikes: (id: number) =>
    api.get<ApiResponse<number>>(`/post/detail/${id}/likes`),

  // 팝업 검색 (전체)
  searchAll: (filter: SearchFilterReqDto) =>
    api.post<ApiResponse<PostListDto[]>>('/post/search/all', filter),

  // 팝업 등록 (ADMIN)
  create: async (token: string, data: PostCreateReqDto, postImage?: File) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, v));
      } else {
        formData.append(key, String(value));
      }
    });

    if (postImage) {
      formData.append('postImage', postImage);
    }

    const res = await fetch(`${API_URL}/admin/post/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },
};
