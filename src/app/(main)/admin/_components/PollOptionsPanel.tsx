'use client';

import { useState, FormEvent } from 'react';
import { pollApi } from '@/lib/poll';
import { PollResDto } from '@/types/poll';

export default function PollOptionsPanel({ poll, token, onRefresh }: { poll: PollResDto; token: string; onRefresh: () => void }) {
  const [newPostId, setNewPostId] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPostId.trim() && !newDesc.trim()) return;
    setAdding(true);
    try {
      await pollApi.adminAddOption(poll.pollId, token, {
        postId: newPostId.trim() ? Number(newPostId.trim()) : undefined,
        description: newDesc.trim() || undefined,
      });
      setNewPostId('');
      setNewDesc('');
      onRefresh();
    } catch { alert('옵션 추가에 실패했습니다.'); }
    finally { setAdding(false); }
  };

  const handleDeleteOption = async (optionId: number) => {
    if (!confirm('옵션을 삭제하시겠습니까?')) return;
    setDeletingId(optionId);
    try {
      await pollApi.adminDeleteOption(optionId, token);
      onRefresh();
    } catch { alert('옵션 삭제에 실패했습니다.'); }
    finally { setDeletingId(null); }
  };

  const inputClass = 'w-full px-3 py-2 bg-white rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 border border-gray-100';

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 mb-2">선택지 ({poll.options.length}개)</p>

      {poll.options.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {poll.options.map((opt) => (
            <div key={opt.optionId} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-100">
              <div className="flex-1 min-w-0">
                {opt.postTitle && <p className="text-xs font-medium text-gray-700 truncate">{opt.postTitle}</p>}
                {opt.description && <p className="text-xs text-gray-400">{opt.description}</p>}
                <p className="text-[10px] text-gray-300 mt-0.5">{opt.voteCount}표 ({opt.votePercentage.toFixed(1)}%)</p>
              </div>
              <button
                onClick={() => handleDeleteOption(opt.optionId)}
                disabled={deletingId === opt.optionId}
                className="text-[11px] text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors flex-shrink-0"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          <input
            value={newPostId}
            onChange={(e) => setNewPostId(e.target.value)}
            placeholder="팝업 ID (선택)"
            className={`${inputClass} w-28 flex-shrink-0`}
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="설명 (선택)"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={adding || (!newPostId.trim() && !newDesc.trim())}
            className="px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg disabled:bg-gray-300 transition-colors flex-shrink-0"
          >
            {adding ? '...' : '추가'}
          </button>
        </div>
      </form>
    </div>
  );
}
