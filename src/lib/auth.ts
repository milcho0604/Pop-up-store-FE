import { api, ApiResponse } from './api';
import { LoginRequest } from '@/types/auth';
import { SignupRequest } from '@/types/member';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<string>>('/member/login', data),

  sendVerificationCode: (email: string) =>
    api.post<ApiResponse<null>>('/member/send-verification-code', { email }),

  verifyEmail: (email: string, code: string) =>
    api.post<ApiResponse<null>>('/member/verify-email', { email, code }),

  signup: async (data: SignupRequest, profileImage?: File) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('nickname', data.nickname);
    formData.append('memberEmail', data.memberEmail);
    formData.append('password', data.password);
    formData.append('phoneNumber', data.phoneNumber);
    if (profileImage) {
      formData.append('image', profileImage);
    }

    const res = await fetch(`${API_URL}/member/sign`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('회원가입 실패');
    return res.json();
  },
};
