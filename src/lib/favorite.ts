import { api, ApiResponse } from './api';
import { FavoriteResDto } from '@/types/member';

export const favoriteApi = {
  check: (postId: number, token: string) =>
    api.withAuth(token).get<ApiResponse<boolean>>(`/favorite/check/${postId}`),

  add: (postId: number, token: string) =>
    api.withAuth(token).post<ApiResponse<null>>(`/favorite/add/${postId}`),

  remove: (postId: number, token: string) =>
    api.withAuth(token).delete<ApiResponse<null>>(`/favorite/remove/${postId}`),

  getMyList: (token: string) =>
    api.withAuth(token).get<ApiResponse<FavoriteResDto[]>>('/favorite/my/list/all'),
};
