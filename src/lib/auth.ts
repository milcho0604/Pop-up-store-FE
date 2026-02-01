import { api, ApiResponse } from './api';
import { LoginRequest } from '@/types/auth';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<string>>('/member/login', data),
};
