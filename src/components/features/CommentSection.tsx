'use client';

import { useEffect, useState, FormEvent } from 'react';
import { CommentDto } from '@/types/comment';
import { commentApi } from '@/lib/comment';

interface CommentSectionProps {
  postId: number;
}

function timeAgo(dateStr: string) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await commentApi.getList(postId);
      setComments(res.result ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    setSubmitting(true);
    try {
      await commentApi.create({ postId, content: content.trim() }, token);
      setContent('');
      await fetchComments();
    } catch {
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await commentApi.delete(id, token);
      await fetchComments();
    } catch {
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        댓글 {comments.length > 0 && <span className="text-gray-400">{comments.length}</span>}
      </h3>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 남겨보세요"
          className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex-shrink-0"
        >
          {submitting ? '...' : '등록'}
        </button>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-20" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
        </p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                {c.profileImg ? (
                  <img src={c.profileImg} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-medium">
                    {c.nickName?.charAt(0) ?? '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{c.nickName}</span>
                  <span className="text-xs text-gray-300">{timeAgo(c.createdTimeAt)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5 break-words">{c.content}</p>
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 self-start mt-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
