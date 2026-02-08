export type NotificationType =
  | 'REGISTER'
  | 'REPORT_NOTIFICATION'
  | 'POST_NOTIFICATION'
  | 'POST'
  | 'COMMENT'
  | 'PAYMENT'
  | 'CHAT'
  | 'FOLLOW'
  | 'LIKE'
  | 'VOTE'
  | 'NOTICE'
  | 'QNA'
  | 'REVIEW';

export interface NotificationDto {
  id: number;
  memberEmail: string;
  title: string;
  content: string;
  isRead: boolean;
  type: NotificationType;
  refId: number | null;
  url: string | null;
  createdAt: string;
}

export interface NotificationCountDto {
  total: number;
  unread: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
