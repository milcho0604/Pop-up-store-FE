'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PollResDto } from '@/types/poll';
import { pollApi } from '@/lib/poll';
import LoginPrompt from '@/components/ui/LoginPrompt';

export default function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [poll, setPoll] = useState<PollResDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await pollApi.getDetail(Number(id));
        setPoll(res.result);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const toggleOption = (optionId: number) => {
    if (voted || poll?.isEnded) return;
    if (poll?.multipleChoice) {
      setSelected((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelected([optionId]);
    }
  };

  const handleVote = async () => {
    if (selected.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setShowLogin(true);
      return;
    }

    setSubmitting(true);
    try {
      await pollApi.vote(Number(id), selected, token);
      setVoted(true);
      // 결과 새로고침
      const res = await pollApi.getDetail(Number(id));
      setPoll(res.result);
    } catch {
      alert('투표에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const showResults = voted || poll?.isEnded;

  return (
    <>
      <div className="px-5 pt-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
        >
          ← 목록으로
        </button>

        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-100 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="space-y-3 mt-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {!loading && !poll && (
          <p className="text-sm text-gray-400 text-center py-16">투표를 찾을 수 없습니다.</p>
        )}

        {!loading && poll && (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                {poll.isEnded ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-500">종료</span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-600">진행중</span>
                )}
                {poll.multipleChoice && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-500">복수선택</span>
                )}
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-1">{poll.title}</h1>
              {poll.description && (
                <p className="text-sm text-gray-400">{poll.description}</p>
              )}
              <p className="text-xs text-gray-300 mt-2">{poll.totalVotes}명 참여</p>
            </div>

            {/* 투표 옵션 */}
            <div className="space-y-3">
              {poll.options.map((option) => {
                const isSelected = selected.includes(option.optionId);

                return (
                  <button
                    key={option.optionId}
                    type="button"
                    onClick={() => toggleOption(option.optionId)}
                    disabled={!!showResults}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'ring-2 ring-gray-900 bg-gray-50'
                        : 'bg-gray-50 hover:bg-gray-100'
                    } ${showResults ? 'cursor-default' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {option.postImgUrl && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={option.postImgUrl} alt="" fill className="object-cover" sizes="48px" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {option.postTitle || option.description}
                        </p>
                        {option.postTitle && option.description && (
                          <p className="text-xs text-gray-400 truncate">{option.description}</p>
                        )}
                      </div>
                      {showResults && (
                        <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                          {option.votePercentage}%
                        </span>
                      )}
                    </div>

                    {/* 결과 바 */}
                    {showResults && (
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-900 rounded-full transition-all duration-500"
                          style={{ width: `${option.votePercentage}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 투표 버튼 */}
            {!showResults && (
              <button
                onClick={handleVote}
                disabled={selected.length === 0 || submitting}
                className="w-full mt-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
              >
                {submitting ? '투표 중...' : '투표하기'}
              </button>
            )}

            {voted && (
              <p className="text-xs text-green-500 text-center mt-4">투표가 완료되었습니다!</p>
            )}
          </>
        )}
      </div>

      <LoginPrompt open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
