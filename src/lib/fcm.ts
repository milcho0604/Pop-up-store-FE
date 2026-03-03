import { api, ApiResponse } from './api';

export const fcmApi = {
  // FCM 토큰 저장 (로그인 후)
  saveToken: (jwtToken: string, fcmToken: string) =>
    api.withAuth(jwtToken).post<ApiResponse<null>>('/fcm/token', { token: fcmToken }),

  // FCM 토큰 삭제 (로그아웃 전)
  logout: (jwtToken: string) =>
    api.withAuth(jwtToken).post<ApiResponse<null>>('/fcm/logout', {}),
};
