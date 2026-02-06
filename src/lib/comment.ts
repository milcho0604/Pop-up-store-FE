import { api, ApiResponse } from './api';
import { CommentDto, CommentCreateRequest, ReplyCreateRequest } from '@/types/comment';

export const commentApi = {
  getList: (postId: number) =>
    api.get<ApiResponse<CommentDto[]>>(`/comment/list/${postId}`),

  create: (data: CommentCreateRequest, token: string) =>
    api.withAuth(token).post<ApiResponse<CommentDto>>('/comment/create', data),

  reply: (data: ReplyCreateRequest, token: string) =>
    api.withAuth(token).post<ApiResponse<CommentDto>>('/comment/reply', data),

  delete: (id: number, token: string) =>
    api.withAuth(token).delete<ApiResponse<null>>(`/comment/delete/${id}`),
};
