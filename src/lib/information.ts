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

  // 어드민: 제보 목록 (상태 필터)
  adminGetList: (token: string, status?: string, page = 0) =>
    api.withAuth(token).get<ApiResponse<{ content: InformationListDto[]; last: boolean }>>(
      `/info/list?page=${page}&size=20${status ? `&status=${status}` : ''}`,
    ),

  // 어드민: 제보 → 팝업 변환(승인)
  adminConvert: (id: number, token: string) => {
    const res = fetch(`${API_URL}/info/convert/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.then((r) => { if (!r.ok) throw new Error(`API Error: ${r.status}`); return r.json(); });
  },

  // 어드민: 제보 반려
  adminReject: (id: number, token: string) => {
    const res = fetch(`${API_URL}/info/reject/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.then((r) => { if (!r.ok) throw new Error(`API Error: ${r.status}`); return r.json(); });
  },

  // 어드민: 제보 삭제
  adminDelete: (id: number, token: string) => {
    const res = fetch(`${API_URL}/info/delete/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.then((r) => { if (!r.ok) throw new Error(`API Error: ${r.status}`); return r.json(); });
  },

  // 어드민: 승인 취소
  adminCancelApproval: (id: number, token: string) => {
    const res = fetch(`${API_URL}/info/cancel-approval/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.then((r) => { if (!r.ok) throw new Error(`API Error: ${r.status}`); return r.json(); });
  },

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
