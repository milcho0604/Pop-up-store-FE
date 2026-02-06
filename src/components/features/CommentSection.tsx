'use client';

import { useEffect, useState, FormEvent } from 'react';
import { CommentDto } from '@/types/comment';
import { commentApi } from '@/lib/comment';
import LoginPrompt from '@/components/ui/LoginPrompt';

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
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

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

  const rootComments = comments.filter((c) => c.parentId === null);
  const getReplies = (parentId: number) =>
    comments.filter((c) => c.parentId === parentId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setShowLogin(true);
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

  const handleReplySubmit = async (e: FormEvent, parentId: number) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setShowLogin(true);
      return;
    }

    setReplySubmitting(true);
    try {
      await commentApi.reply(
        { postId, parentId, content: replyContent.trim() },
        token
      );
      setReplyContent('');
      setReplyingTo(null);
      await fetchComments();
    } catch {
      alert('답글 작성에 실패했습니다.');
    } finally {
      setReplySubmitting(false);
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

  const toggleReply = (commentId: number) => {
    if (replyingTo === commentId) {
      setReplyingTo(null);
      setReplyContent('');
    } else {
      setReplyingTo(commentId);
      setReplyContent('');
    }
  };

  const renderComment = (c: CommentDto, isReply = false) => (
    <div key={c.id} className={`flex gap-3 ${isReply ? 'ml-10' : ''}`}>
      <div
        className={`rounded-full bg-gray-200 flex-shrink-0 overflow-hidden ${
          isReply ? 'w-6 h-6' : 'w-8 h-8'
        }`}
      >
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
          <span className={`font-medium text-gray-900 ${isReply ? 'text-xs' : 'text-sm'}`}>
            {c.nickName}
          </span>
          <span className="text-xs text-gray-300">{timeAgo(c.createdTimeAt)}</span>
        </div>
        <p className={`text-gray-600 mt-0.5 break-words ${isReply ? 'text-xs' : 'text-sm'}`}>
          {c.content}
        </p>
        {!isReply && (
          <button
            onClick={() => toggleReply(c.id)}
            className="text-xs text-gray-400 hover:text-gray-600 mt-1 transition-colors"
          >
            {replyingTo === c.id ? '취소' : '답글'}
          </button>
        )}
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
  );

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
          {rootComments.map((c) => (
            <div key={c.id}>
              {renderComment(c)}

              {/* Reply Input */}
              {replyingTo === c.id && (
                <form
                  onSubmit={(e) => handleReplySubmit(e, c.id)}
                  className="flex gap-2 ml-10 mt-3"
                >
                  <input
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`${c.nickName}님에게 답글 남기기`}
                    autoFocus
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                  <button
                    type="submit"
                    disabled={replySubmitting || !replyContent.trim()}
                    className="px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex-shrink-0"
                  >
                    {replySubmitting ? '...' : '등록'}
                  </button>
                </form>
              )}

              {/* Replies */}
              {getReplies(c.id).length > 0 && (
                <div className="space-y-3 mt-3">
                  {getReplies(c.id).map((reply) => renderComment(reply, true))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <LoginPrompt open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}