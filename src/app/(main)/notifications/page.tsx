'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { notificationApi } from '@/lib/notification';
import { NotificationDto, NotificationType } from '@/types/notification';
import LoginPrompt from '@/components/ui/LoginPrompt';

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case 'POST':
    case 'POST_NOTIFICATION':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case 'COMMENT':
    case 'QNA':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'FOLLOW':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      );
    case 'LIKE':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case 'REVIEW':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'VOTE':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case 'NOTICE':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
  }
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

function getNotificationLink(notification: NotificationDto): string | null {
  if (notification.url) return notification.url;
  if (!notification.refId) return null;

  switch (notification.type) {
    case 'POST':
    case 'POST_NOTIFICATION':
    case 'COMMENT':
    case 'LIKE':
    case 'REVIEW':
      return `/popup/${notification.refId}`;
    default:
      return null;
  }
}

type FilterType = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const observerRef = useRef<HTMLDivElement>(null);

  const getToken = () => localStorage.getItem('token');

  const fetchNotifications = useCallback(async (pageNum: number, currentFilter: FilterType, append = false) => {
    const token = getToken();
    if (!token) {
      setShowLogin(true);
      setLoading(false);
      return;
    }

    try {
      const fetcher = currentFilter === 'unread'
        ? notificationApi.getUnreadList
        : notificationApi.getList;
      const res = await fetcher(token, pageNum);
      const pageData = res.result;
      const newItems = pageData.content ?? [];

      setNotifications(prev => append ? [...prev, ...newItems] : newItems);
      setHasMore(!pageData.last);
    } catch {
      // 에러 시 조용히 처리
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setNotifications([]);
    setPage(0);
    setHasMore(true);
    fetchNotifications(0, filter);
  }, [filter, fetchNotifications]);

  // 무한 스크롤
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchNotifications(nextPage, filter, true);
        }
      },
      { threshold: 0.1 }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loadingMore, loading, page, filter, fetchNotifications]);

  // 'read' 필터는 전체 목록에서 클라이언트 필터링
  const displayNotifications = filter === 'read'
    ? notifications.filter(n => n.isRead)
    : notifications;

  const handleMarkAllRead = async () => {
    const token = getToken();
    if (!token) return;

    try {
      await notificationApi.markAllAsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // 에러 시 조용히 처리
    }
  };

  const handleNotificationClick = async (notification: NotificationDto) => {
    const token = getToken();

    // 읽음 처리
    if (!notification.isRead && token) {
      try {
        await notificationApi.markAsRead(token, notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      } catch {
        // 에러 시 조용히 처리
      }
    }

    // 관련 페이지로 이동
    const link = getNotificationLink(notification);
    if (link) router.push(link);
  };

  const hasUnread = notifications.some(n => !n.isRead);

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'unread', label: '읽지 않은' },
    { key: 'read', label: '읽은' },
  ];

  return (
    <>
      <div className="px-5 pt-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">알림</h1>
          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              전체 읽음
            </button>
          )}
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 mb-5">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === tab.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 로딩 스켈레톤 */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-2xl animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && displayNotifications.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">
              {filter === 'unread' ? '읽지 않은 알림이 없습니다' : filter === 'read' ? '읽은 알림이 없습니다' : '알림이 없습니다'}
            </p>
          </div>
        )}

        {/* 알림 리스트 */}
        {!loading && displayNotifications.length > 0 && (
          <div className="space-y-1">
            {displayNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full flex gap-3 p-4 rounded-2xl text-left transition-colors ${
                  notification.isRead
                    ? 'hover:bg-gray-50'
                    : 'bg-blue-50/50 hover:bg-blue-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notification.isRead ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'
                }`}>
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${
                    notification.isRead ? 'text-gray-500' : 'text-gray-900 font-medium'
                  }`}>
                    {notification.title}
                  </p>
                  {notification.content && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {notification.content}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-300 mt-1">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* 추가 로딩 */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
          </div>
        )}

        {/* 무한 스크롤 트리거 */}
        <div ref={observerRef} className="h-4" />
      </div>

      <LoginPrompt open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
