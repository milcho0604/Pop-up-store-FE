import { api, ApiResponse } from './api';
import { InformationListDto } from '@/types/member';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface InformationCreateReqDto {
  title: string;
  content: string;
  startDate: string;
  endDate: string;
  phoneNumber?: string;
  city?: string;
  dong?: string;
  street?: string;
  zipcode?: string;
  detailAddress?: string;
  category?: string;
  tagNames?: string[];
}

export const informationApi = {
  // 내 제보 목록
  getMyList: (token: string) =>
    api.withAuth(token).get<ApiResponse<InformationListDto[]>>('/info/my/list'),

  // 팝업 제보 등록
  create: async (token: string, data: InformationCreateReqDto, postImage?: File) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, v));
      } else {
        formData.append(key, String(value));
      }
    });

    if (postImage) {
      formData.append('postImage', postImage);
    }

    const res = await fetch(`${API_URL}/info/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },
};
