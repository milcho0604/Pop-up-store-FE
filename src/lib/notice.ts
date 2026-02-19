import { api, ApiResponse } from './api';
import { NoticeResDto } from '@/types/notice';

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
};
