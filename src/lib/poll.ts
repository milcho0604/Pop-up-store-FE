import { api, ApiResponse } from './api';
import { PollResDto } from '@/types/poll';

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
};
