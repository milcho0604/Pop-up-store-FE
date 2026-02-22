import { api, ApiResponse } from './api';
import { CommentDto, CommentCreateRequest, ReplyCreateRequest } from '@/types/comment';

export const commentApi = {
  getList: (postId: number) =>
    api.get<ApiResponse<CommentDto[]>>(`/comment/list/${postId}`),

  create: (data: CommentCreateRequest, token: string) =>
    api.withAuth(token).post<ApiResponse<CommentDto>>('/comment/create', data),

  reply: (data: ReplyCreateRequest, token: string) =>
    api.withAuth(token).post<ApiResponse<CommentDto>>('/comment/reply', data),

  // 댓글 수정
  update: (data: { id: number; postId: number; content: string }, token: string) =>
    api.withAuth(token).post<ApiResponse<null>>('/comment/update', data),

  // 댓글 삭제
  delete: (id: number, token: string) =>
    api.withAuth(token).post<ApiResponse<null>>(`/comment/delete/${id}`),
};
