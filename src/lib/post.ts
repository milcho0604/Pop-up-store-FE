import { api, ApiResponse } from './api';
import { PostListDto, PostDetailDto, SearchFilterReqDto } from '@/types/post';

export const postApi = {
  getPopularList: () =>
    api.get<ApiResponse<PostListDto[]>>('/post/good/list'),

  getList: () =>
    api.get<ApiResponse<PostListDto[]>>('/post/list'),

  getDetail: (id: number) =>
    api.get<ApiResponse<PostDetailDto>>(`/post/detail/${id}`),

  incrementViews: (id: number) =>
    api.get<ApiResponse<number>>(`/post/detail/views/${id}`),

  like: (id: number, token: string) =>
    api.withAuth(token).post<ApiResponse<number>>(`/post/detail/like/${id}`),

  unlike: (id: number, token: string) =>
    api.withAuth(token).post<ApiResponse<number>>(`/post/detail/unlike/${id}`),

  getLikes: (id: number) =>
    api.get<ApiResponse<number>>(`/post/detail/${id}/likes`),

  searchAll: (filter: SearchFilterReqDto) =>
    api.post<ApiResponse<PostListDto[]>>('/post/search/all', filter),
};
