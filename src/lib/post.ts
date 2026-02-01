import { api, ApiResponse } from './api';
import { PostListDto } from '@/types/post';

export const postApi = {
  getPopularList: () =>
    api.get<ApiResponse<PostListDto[]>>('/post/good/list'),

  getList: () =>
    api.get<ApiResponse<PostListDto[]>>('/post/list'),

  getDetail: (id: number) =>
    api.get<ApiResponse<PostListDto>>(`/post/detail/${id}`),

  getDetailWithViews: (id: number) =>
    api.get<ApiResponse<PostListDto>>(`/post/detail/views/${id}`),
};
