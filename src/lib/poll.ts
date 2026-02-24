import { api, ApiResponse } from './api';
import { PollResDto } from '@/types/poll';

export interface PollSaveDto {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  multipleChoice?: boolean;
}

export const pollApi = {
  // 활성 투표 전체 목록
  getActiveList: () =>
    api.get<ApiResponse<PollResDto[]>>('/poll/active/all'),

  // 투표 상세 (결과 포함)
  getDetail: (id: number) =>
    api.get<ApiResponse<PollResDto>>(`/poll/${id}`),

  // 투표하기
  vote: (pollId: number, optionIds: number[], token: string) =>
    api.withAuth(token).post<ApiResponse<null>>(`/poll/${pollId}/vote`, { optionIds }),

  // 내가 참여한 투표 목록
  getMyVotes: (token: string) =>
    api.withAuth(token).get<ApiResponse<PollResDto[]>>('/poll/my/votes'),

  // 어드민: 투표 목록
  adminGetList: (token: string) =>
    api.withAuth(token).get<ApiResponse<{ content: PollResDto[] }>>('/poll/admin/list?page=0&size=100'),

  // 어드민: 투표 생성
  adminCreate: (token: string, data: PollSaveDto) =>
    api.withAuth(token).post<ApiResponse<PollResDto>>('/poll/admin/create', data),

  // 어드민: 투표 수정
  adminUpdate: (id: number, token: string, data: Partial<PollSaveDto>) =>
    api.withAuth(token).put<ApiResponse<PollResDto>>(`/poll/admin/${id}`, data),

  // 어드민: 투표 삭제
  adminDelete: (id: number, token: string) =>
    api.withAuth(token).delete<ApiResponse<null>>(`/poll/admin/${id}`),
};
