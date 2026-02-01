import { api, ApiResponse } from './api';

export const favoriteApi = {
  check: (postId: number, token: string) =>
    api.withAuth(token).get<ApiResponse<boolean>>(`/favorite/check/${postId}`),

  add: (postId: number, token: string) =>
    api.withAuth(token).post<ApiResponse<null>>(`/favorite/add/${postId}`),

  remove: (postId: number, token: string) =>
    api.withAuth(token).delete<ApiResponse<null>>(`/favorite/remove/${postId}`),
};
