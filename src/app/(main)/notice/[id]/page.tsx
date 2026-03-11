'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [notice, setNotice] = useState<NoticeResDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await noticeApi.getDetail(Number(id));
        setNotice(res.result);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchNotice();
  }, [id]);

  return (
    <div className="px-5 pt-4 pb-8">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
      >
        ← 목록으로
      </button>

      {loading && (
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
          <div className="space-y-2 mt-6">
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      )}

      {!loading && !notice && (
        <p className="text-sm text-gray-400 text-center py-16">공지사항을 찾을 수 없습니다.</p>
      )}

      {!loading && notice && (
        <article>
          {/* 타입 뱃지 */}
          <div className="flex items-center gap-2 mb-2">
            {(() => {
              const typeInfo = noticeTypeLabel[notice.noticeType] ?? { text: notice.noticeType, color: 'bg-gray-100 text-gray-500' };
              return (
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${typeInfo.color}`}>
                  {typeInfo.text}
                </span>
              );
            })()}
          </div>

          <h1 className="text-lg font-bold text-gray-900 mb-2">{notice.title}</h1>

          {/* 메타 정보 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mb-1">
            {notice.authorName && <span>{notice.authorName}</span>}
            <span>{formatDate(notice.createdAt)}</span>
            <span>조회 {notice.viewCount}</span>
          </div>
          {/* 게시 기간 */}
          {(notice.startDate || notice.endDate) && (
            <p className="text-xs text-gray-300 mb-6">
              {formatDate(notice.startDate)} ~ {formatDate(notice.endDate)}
            </p>
          )}

          <div className="border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
          </div>
        </article>
      )}
    </div>
  );
}
