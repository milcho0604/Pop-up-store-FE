import { api, ApiResponse } from './api';
import { NotificationDto, NotificationCountDto, PageResponse } from '@/types/notification';

export const notificationApi = {
  getList: (token: string, page: number = 0) =>
    api.withAuth(token).get<ApiResponse<PageResponse<NotificationDto>>>(`/noti/list?page=${page}&size=10`),

  getUnreadList: (token: string, page: number = 0) =>
    api.withAuth(token).get<ApiResponse<PageResponse<NotificationDto>>>(`/noti/un-read/list?page=${page}&size=10`),

  getCount: (token: string) =>
    api.withAuth(token).get<ApiResponse<NotificationCountDto>>('/noti/count'),

  markAsRead: (token: string, id: number) =>
    api.withAuth(token).patch<ApiResponse<unknown>>(`/noti/read/${id}`),

  markAllAsRead: (token: string) =>
    api.withAuth(token).patch<ApiResponse<unknown>>('/noti/read/all'),
};
