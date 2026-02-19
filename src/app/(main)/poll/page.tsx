'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PollResDto } from '@/types/poll';
import { pollApi } from '@/lib/poll';

export default function PollListPage() {
  const [polls, setPolls] = useState<PollResDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await pollApi.getActiveList();
        setPolls(res.result ?? []);
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
      <h1 className="text-xl font-bold text-gray-900 mb-6">투표</h1>

      {loading && (
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

      {!loading && polls.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-16">진행중인 투표가 없습니다.</p>
      )}

      {!loading && polls.length > 0 && (
        <div className="space-y-4">
          {polls.map((poll) => (
            <Link
              key={poll.pollId}
              href={`/poll/${poll.pollId}`}
              className="block p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
            >
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
    </div>
  );
}
