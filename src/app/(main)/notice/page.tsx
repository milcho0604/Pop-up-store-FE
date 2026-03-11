'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NoticeResDto } from '@/types/notice';
import { noticeApi } from '@/lib/notice';

const noticeTypeLabel: Record<string, { text: string; color: string }> = {
  IMPORTANT: { text: '중요', color: 'bg-red-100 text-red-600' },
  POPUP:     { text: '긴급', color: 'bg-orange-100 text-orange-600' },
  NORMAL:    { text: '일반', color: 'bg-gray-100 text-gray-500' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function NoticePage() {
  const [notices, setNotices] = useState<NoticeResDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await noticeApi.getActiveList();
        setNotices(res.result ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="px-5 pt-4">
      <h1 className="text-xl font-bold text-gray-900 mb-6">공지사항</h1>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2 py-4 border-b border-gray-50">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {!loading && notices.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-16">공지사항이 없습니다.</p>
      )}

      {!loading && notices.length > 0 && (
        <div className="divide-y divide-gray-50">
          {notices.map((notice) => {
            const typeInfo = noticeTypeLabel[notice.noticeType] ?? { text: notice.noticeType, color: 'bg-gray-100 text-gray-500' };
            return (
              <Link
                key={notice.noticeId}
                href={`/notice/${notice.noticeId}`}
                className="block py-4 group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${typeInfo.color}`}>
                    {typeInfo.text}
                  </span>
                  <span className="text-xs text-gray-300">{formatDate(notice.createdAt)}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-600 transition-colors">
                  {notice.title}
                </h3>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
