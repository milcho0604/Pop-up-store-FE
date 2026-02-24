import { api, ApiResponse } from './api';
import { NoticeResDto } from '@/types/notice';

export interface NoticeSaveDto {
  title: string;
  content: string;
  noticeType: 'NORMAL' | 'IMPORTANT' | 'POPUP';
  startDate: string;
  endDate: string;
}

export const noticeApi = {
  // 활성 공지사항 전체 목록
  getActiveList: () =>
    api.get<ApiResponse<NoticeResDto[]>>('/notice/active/all'),

  // 공지사항 상세 (조회수 증가)
  getDetail: (id: number) =>
    api.get<ApiResponse<NoticeResDto>>(`/notice/${id}`),

  // 팝업 공지사항
  getPopupNotices: () =>
    api.get<ApiResponse<NoticeResDto[]>>('/notice/popup'),

  // 어드민: 공지 목록
  adminGetList: (token: string) =>
    api.withAuth(token).get<ApiResponse<{ content: NoticeResDto[] }>>('/notice/admin/list?page=0&size=100'),

  // 어드민: 공지 작성
  adminCreate: (token: string, data: NoticeSaveDto) =>
    api.withAuth(token).post<ApiResponse<NoticeResDto>>('/notice/admin/create', data),

  // 어드민: 공지 수정
  adminUpdate: (id: number, token: string, data: Partial<NoticeSaveDto>) =>
    api.withAuth(token).put<ApiResponse<NoticeResDto>>(`/notice/admin/${id}`, data),

  // 어드민: 공지 삭제
  adminDelete: (id: number, token: string) =>
    api.withAuth(token).delete<ApiResponse<null>>(`/notice/admin/${id}`),
};
