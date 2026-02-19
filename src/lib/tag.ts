import { api, ApiResponse } from './api';
import { TagDto } from '@/types/post';

export const tagApi = {
  // 전체 태그 목록
  getList: () =>
    api.get<ApiResponse<TagDto[]>>('/tag/list'),

  // 인기 태그 목록
  getPopular: (limit = 10) =>
    api.get<ApiResponse<TagDto[]>>(`/tag/popular?limit=${limit}`),
};
