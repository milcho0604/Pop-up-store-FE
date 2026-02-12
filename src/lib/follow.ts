import { api, ApiResponse } from './api';
import { FollowStatsDto } from '@/types/member';

export const followApi = {
  getMyStats: (token: string) =>
    api.withAuth(token).get<ApiResponse<FollowStatsDto>>('/follow/my/stats'),
};
