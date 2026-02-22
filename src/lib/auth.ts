import { api, ApiResponse } from './api';
import { LoginRequest } from '@/types/auth';
import { SignupRequest } from '@/types/member';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// JWT 토큰 페이로드 파싱
function parseTokenPayload(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

// JWT 토큰에서 role 추출
export function getTokenRole(token: string): string | null {
  return (parseTokenPayload(token)?.role as string) ?? null;
}

// JWT 토큰에서 email(sub) 추출
export function getTokenEmail(token: string): string | null {
  return (parseTokenPayload(token)?.sub as string) ?? null;
}

// JWT 토큰에서 memberId 추출
export function getTokenMemberId(token: string): number | null {
  const payload = parseTokenPayload(token);
  return typeof payload?.memberId === 'number' ? payload.memberId : null;
}

export function isAdmin(token: string | null): boolean {
  if (!token) return false;
  return getTokenRole(token) === 'ROLE_ADMIN';
}

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

  // 비밀번호 재설정 링크 전송
  findPassword: (memberEmail: string) =>
    api.post<ApiResponse<null>>('/member/find/password', { memberEmail }),

  // 비밀번호 재설정
  resetPassword: (token: string, newPassword: string, confirmPassword: string) =>
    api.post<ApiResponse<null>>('/member/reset/password', { token, newPassword, confirmPassword }),
};
