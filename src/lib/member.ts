import { api, ApiResponse } from './api';
import { MemberProfileResDto, MemberProfileUpdateReqDto } from '@/types/member';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const memberApi = {
  getProfile: (token: string) =>
    api.withAuth(token).get<ApiResponse<MemberProfileResDto>>('/profile/me'),

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
