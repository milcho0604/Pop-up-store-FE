import { api, ApiResponse } from './api';

export const favoriteApi = {
  add: (postId: number, token: string) =>
    api.withAuth(token).post<ApiResponse<null>>(`/favorite/add/${postId}`),

  remove: (postId: number, token: string) =>
    api.withAuth(token).delete<ApiResponse<null>>(`/favorite/remove/${postId}`),
};
