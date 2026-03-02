'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NoticeResDto } from '@/types/notice';
import { PollResDto } from '@/types/poll';
import { noticeApi } from '@/lib/notice';
import { pollApi } from '@/lib/poll';

type TabType = 'notice' | 'poll';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

const noticeTypeLabel: Record<string, { text: string; color: string }> = {
  NORMAL:    { text: '일반',  color: 'bg-gray-100 text-gray-500' },
  IMPORTANT: { text: '중요',  color: 'bg-red-50 text-red-500' },
  POPUP:     { text: '팝업',  color: 'bg-blue-50 text-blue-500' },
};

export default function CommunityPage() {
  const [tab, setTab] = useState<TabType>('notice');
  const [notices, setNotices] = useState<NoticeResDto[]>([]);
  const [polls, setPolls] = useState<PollResDto[]>([]);
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [pollLoading, setPollLoading] = useState(true);

  useEffect(() => {
    noticeApi.getActiveList()
      .then((res) => setNotices(res.result ?? []))
      .catch(() => {})
      .finally(() => setNoticeLoading(false));

    pollApi.getActiveList()
      .then((res) => setPolls(res.result ?? []))
      .catch(() => {})
      .finally(() => setPollLoading(false));
  }, []);

  return (
    <div className="px-5 pt-4">
      <h1 className="text-xl font-bold text-gray-900 mb-5">커뮤니티</h1>

      {/* 탭 */}
      <div className="flex gap-2 mb-5">
        {([
          { key: 'notice' as const, label: '공지사항' },
          { key: 'poll'   as const, label: '투표' },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              tab === t.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 공지사항 */}
      {tab === 'notice' && (
        <>
          {noticeLoading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2 py-4 border-b border-gray-50">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          )}
          {!noticeLoading && notices.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-16">공지사항이 없습니다.</p>
          )}
          {!noticeLoading && notices.length > 0 && (
            <div className="divide-y divide-gray-50">
              {notices.map((notice) => {
                const badge = noticeTypeLabel[notice.noticeType] ?? { text: notice.noticeType, color: 'bg-gray-100 text-gray-500' };
                return (
                  <Link key={notice.noticeId} href={`/notice/${notice.noticeId}`} className="block py-4 group">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${badge.color}`}>
                        {badge.text}
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
        </>
      )}

      {/* 투표 */}
      {tab === 'poll' && (
        <>
          {pollLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-2xl space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          )}
          {!pollLoading && polls.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-16">진행중인 투표가 없습니다.</p>
          )}
          {!pollLoading && polls.length > 0 && (
            <div className="space-y-4">
              {polls.map((poll) => (
                <Link key={poll.pollId} href={`/poll/${poll.pollId}`} className="block p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    {poll.isEnded ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-500">종료</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-600">진행중</span>
                    )}
                    {poll.multipleChoice && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-500">복수선택</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{poll.title}</h3>
                  {poll.description && (
                    <p className="text-xs text-gray-400 mb-2 line-clamp-2">{poll.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{poll.totalVotes}명 참여</span>
                    <span>{poll.options.length}개 항목</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
