import { api, ApiResponse } from './api';
import { LoginRequest, LoginResponse } from '@/types/auth';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/member/login', data),
};
