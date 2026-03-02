import { api, ApiResponse } from './api';
import { FollowStatsDto, FollowDto } from '@/types/member';

export const followApi = {
  // 내 팔로우 통계
  getMyStats: (token: string) =>
    api.withAuth(token).get<ApiResponse<FollowStatsDto>>('/follow/my/stats'),

  // 팔로우
  follow: (memberId: number, token: string) =>
    api.withAuth(token).post<ApiResponse<null>>(`/follow/${memberId}`),

  // 언팔로우
  unfollow: (memberId: number, token: string) =>
    api.withAuth(token).delete<ApiResponse<null>>(`/follow/${memberId}`),

  // 팔로우 여부 확인
  check: (memberId: number, token: string) =>
    api.withAuth(token).get<ApiResponse<boolean>>(`/follow/${memberId}/check`),

  // 특정 회원 팔로우 통계
  getStats: (memberId: number) =>
    api.get<ApiResponse<FollowStatsDto>>(`/follow/${memberId}/stats`),

  // 내 팔로워 목록
  getMyFollowers: (token: string) =>
    api.withAuth(token).get<ApiResponse<FollowDto[]>>('/follow/my/followers'),

  // 내 팔로잉 목록
  getMyFollowings: (token: string) =>
    api.withAuth(token).get<ApiResponse<FollowDto[]>>('/follow/my/followings'),
};
