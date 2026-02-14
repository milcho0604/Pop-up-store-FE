import { api, ApiResponse } from './api';
import { ReviewResDto, ReviewCreateReqDto } from '@/types/review';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const reviewApi = {
  // 해당 팝업 리뷰 전체 조회
  getList: (postId: number) =>
    api.get<ApiResponse<ReviewResDto[]>>(`/review/post/${postId}/all`),

  // 리뷰 작성
  create: async (
    postId: number,
    data: ReviewCreateReqDto,
    token: string,
    reviewImage?: File,
  ) => {
    const formData = new FormData();
    formData.append('content', data.content);
    formData.append('satisfaction', String(data.satisfaction));
    formData.append('waitingTime', String(data.waitingTime));
    formData.append('photoAvailability', String(data.photoAvailability));

    if (reviewImage) {
      formData.append('reviewImage', reviewImage);
    }

    const res = await fetch(`${API_URL}/review/create/${postId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  // 리뷰 수정
  update: async (
    reviewId: number,
    data: Partial<ReviewCreateReqDto>,
    token: string,
    reviewImage?: File,
  ) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });

    if (reviewImage) {
      formData.append('reviewImage', reviewImage);
    }

    const res = await fetch(`${API_URL}/review/${reviewId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  // 리뷰 삭제
  delete: (reviewId: number, token: string) =>
    api.withAuth(token).delete<ApiResponse<null>>(`/review/${reviewId}`),
};
