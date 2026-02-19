'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { NoticeResDto } from '@/types/notice';
import { noticeApi } from '@/lib/notice';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export default function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [notice, setNotice] = useState<NoticeResDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await noticeApi.getDetail(Number(id));
        setNotice(res.result);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  return (
    <div className="px-5 pt-4">
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
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
              {notice.noticeType}
            </span>
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">{notice.title}</h1>
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-6">
            <span>{formatDate(notice.createdAt)}</span>
            <span>조회 {notice.viewCount}</span>
          </div>
          <div className="border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
          </div>
        </article>
      )}
    </div>
  );
}
