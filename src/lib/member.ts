import { api, ApiResponse } from './api';
import { MemberProfileResDto, MemberProfileUpdateReqDto, MemberListResDto } from '@/types/member';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const memberApi = {
  getProfile: (token: string) =>
    api.withAuth(token).get<ApiResponse<MemberProfileResDto>>('/profile/me'),

  getProfileById: (memberId: number) =>
    api.get<ApiResponse<MemberProfileResDto>>(`/profile/${memberId}`),

  // 어드민: 회원 목록
  adminGetList: (token: string, params?: { isVerified?: boolean; isDeleted?: boolean; role?: string }) => {
    const query = new URLSearchParams({ page: '0', size: '50' });
    if (params?.isVerified !== undefined) query.set('isVerified', String(params.isVerified));
    if (params?.isDeleted !== undefined) query.set('isDeleted', String(params.isDeleted));
    if (params?.role) query.set('role', params.role);
    return api.withAuth(token).get<ApiResponse<{ content: MemberListResDto[] }>>(`/admin/member/list?${query}`);
  },

  updateProfile: async (
    token: string,
    data: MemberProfileUpdateReqDto,
    profileImage?: File
  ): Promise<ApiResponse<MemberProfileResDto>> => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    if (profileImage) {
      formData.append('profileImage', profileImage);
    }

    const res = await fetch(`${API_URL}/profile/me`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  },
};
