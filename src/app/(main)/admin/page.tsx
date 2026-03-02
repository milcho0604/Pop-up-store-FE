'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { informationApi } from '@/lib/information';
import { noticeApi, NoticeSaveDto } from '@/lib/notice';
import { pollApi, PollSaveDto } from '@/lib/poll';
import { memberApi } from '@/lib/member';
import { InformationListDto } from '@/types/member';
import { NoticeResDto } from '@/types/notice';
import { PollResDto } from '@/types/poll';
import { MemberListResDto } from '@/types/member';
import { timeAgo } from '@/lib/time';

type TabType = 'reports' | 'notices' | 'polls' | 'members';

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function toDatetimeLocal(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string) {
  if (!value) return '';
  return value.replace('T', ' ') + ':00';
}

const statusLabel: Record<string, { text: string; color: string }> = {
  PENDING:  { text: '대기중', color: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { text: '승인됨', color: 'bg-green-100 text-green-700' },
  REJECTED: { text: '반려됨', color: 'bg-red-100 text-red-700' },
};

// ─── 제보 관리 탭 ──────────────────────────────────────────────────────────────
function ReportsTab({ token }: { token: string }) {
  const [items, setItems] = useState<InformationListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetch = async (status = statusFilter) => {
    setLoading(true);
    try {
      const res = await informationApi.adminGetList(token, status || undefined);
      setItems(res.result?.content ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusFilter = (s: string) => {
    setStatusFilter(s);
    fetch(s);
  };

  const handleAction = async (id: number, action: 'convert' | 'reject' | 'delete' | 'cancel') => {
    setActionLoading(id);
    try {
      if (action === 'convert') await informationApi.adminConvert(id, token);
      else if (action === 'reject') await informationApi.adminReject(id, token);
      else if (action === 'delete') await informationApi.adminDelete(id, token);
      else if (action === 'cancel') await informationApi.adminCancelApproval(id, token);
      await fetch();
    } catch {
      alert('처리에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const filterTabs = [
    { value: '', label: '전체' },
    { value: 'PENDING', label: '대기중' },
    { value: 'APPROVED', label: '승인됨' },
    { value: 'REJECTED', label: '반려됨' },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {filterTabs.map((t) => (
          <button
            key={t.value}
            onClick={() => handleStatusFilter(t.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              statusFilter === t.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">제보가 없습니다</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const s = statusLabel[item.status] ?? { text: item.status, color: 'bg-gray-100 text-gray-500' };
            const busy = actionLoading === item.id;
            return (
              <div key={item.id} className="p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate flex-1">{item.title}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>{s.text}</span>
                </div>
                <p className="text-xs text-gray-400 mb-1">
                  {item.reporterNickname} · {timeAgo(item.createdTimeAt)}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{item.content}</p>
                <div className="flex gap-2">
                  {item.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAction(item.id, 'convert')}
                        disabled={busy}
                        className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleAction(item.id, 'reject')}
                        disabled={busy}
                        className="px-3 py-1.5 bg-red-100 text-red-600 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
                      >
                        반려
                      </button>
                    </>
                  )}
                  {item.status === 'APPROVED' && (
                    <button
                      onClick={() => handleAction(item.id, 'cancel')}
                      disabled={busy}
                      className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
                    >
                      승인 취소
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm('제보를 삭제하시겠습니까?')) handleAction(item.id, 'delete'); }}
                    disabled={busy}
                    className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors ml-auto"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 공지사항 관리 탭 ───────────────────────────────────────────────────────────
function NoticesTab({ token }: { token: string }) {
  const [items, setItems] = useState<NoticeResDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<NoticeResDto | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noticeType, setNoticeType] = useState<'NORMAL' | 'IMPORTANT' | 'POPUP'>('NORMAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await noticeApi.adminGetList(token);
      setItems(res.result?.content ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditTarget(null);
    setTitle(''); setContent(''); setNoticeType('NORMAL'); setStartDate(''); setEndDate('');
    setShowForm(true);
  };

  const openEdit = (item: NoticeResDto) => {
    setEditTarget(item);
    setTitle(item.title);
    setContent(item.content);
    setNoticeType(item.noticeType as 'NORMAL' | 'IMPORTANT' | 'POPUP');
    setStartDate(toDatetimeLocal(item.startDate));
    setEndDate(toDatetimeLocal(item.endDate));
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !startDate || !endDate) return;
    setSaving(true);
    try {
      const data: NoticeSaveDto = {
        title: title.trim(), content: content.trim(), noticeType,
        startDate: fromDatetimeLocal(startDate), endDate: fromDatetimeLocal(endDate),
      };
      if (editTarget) {
        await noticeApi.adminUpdate(editTarget.noticeId, token, data);
      } else {
        await noticeApi.adminCreate(token, data);
      }
      setShowForm(false);
      await fetchList();
    } catch { alert('저장에 실패했습니다.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('공지사항을 삭제하시겠습니까?')) return;
    try {
      await noticeApi.adminDelete(id, token);
      await fetchList();
    } catch { alert('삭제에 실패했습니다.'); }
  };

  const typeLabels: Record<string, string> = { NORMAL: '일반', IMPORTANT: '중요', POPUP: '팝업' };
  const inputClass = 'w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200';

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className="px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-xl hover:bg-gray-800 transition-colors">
          + 공지 작성
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 bg-gray-50 rounded-2xl space-y-3">
          <p className="text-sm font-semibold text-gray-900">{editTarget ? '공지 수정' : '공지 작성'}</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className={inputClass} />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용" rows={3} className={`${inputClass} resize-none`} />
          <select value={noticeType} onChange={(e) => setNoticeType(e.target.value as 'NORMAL' | 'IMPORTANT' | 'POPUP')} className={inputClass}>
            <option value="NORMAL">일반</option>
            <option value="IMPORTANT">중요</option>
            <option value="POPUP">팝업</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">시작일시</label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">종료일시</label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-xl disabled:bg-gray-300 transition-colors">
              {saving ? '저장 중...' : '저장'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              취소
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">공지사항이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.noticeId} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">{typeLabels[item.noticeType] ?? item.noticeType}</span>
                  <span className="text-sm font-medium text-gray-900 truncate">{item.title}</span>
                </div>
                <p className="text-xs text-gray-400">{formatDate(item.startDate)} ~ {formatDate(item.endDate)}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(item)} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">수정</button>
                <button onClick={() => handleDelete(item.noticeId)} className="text-xs text-red-400 hover:text-red-600 transition-colors">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 투표 옵션 관리 서브뷰 ─────────────────────────────────────────────────────
function PollOptionsPanel({ poll, token, onRefresh }: { poll: PollResDto; token: string; onRefresh: () => void }) {
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

// ─── 투표 관리 탭 ───────────────────────────────────────────────────────────────
function PollsTab({ token }: { token: string }) {
  const [items, setItems] = useState<PollResDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<PollResDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [multipleChoice, setMultipleChoice] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await pollApi.adminGetList(token);
      setItems(res.result?.content ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditTarget(null);
    setTitle(''); setDescription(''); setStartDate(''); setEndDate(''); setMultipleChoice(false);
    setShowForm(true);
  };

  const openEdit = (item: PollResDto) => {
    setEditTarget(item);
    setTitle(item.title);
    setDescription(item.description ?? '');
    setStartDate(toDatetimeLocal(item.startDate));
    setEndDate(toDatetimeLocal(item.endDate));
    setMultipleChoice(item.multipleChoice);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;
    setSaving(true);
    try {
      const data: PollSaveDto = {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: fromDatetimeLocal(startDate),
        endDate: fromDatetimeLocal(endDate),
        multipleChoice,
      };
      if (editTarget) {
        await pollApi.adminUpdate(editTarget.pollId, token, data);
      } else {
        await pollApi.adminCreate(token, data);
      }
      setShowForm(false);
      await fetchList();
    } catch { alert('저장에 실패했습니다.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('투표를 삭제하시겠습니까?')) return;
    try {
      await pollApi.adminDelete(id, token);
      if (expandedId === id) setExpandedId(null);
      await fetchList();
    } catch { alert('삭제에 실패했습니다.'); }
  };

  const inputClass = 'w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200';

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className="px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-xl hover:bg-gray-800 transition-colors">
          + 투표 생성
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 bg-gray-50 rounded-2xl space-y-3">
          <p className="text-sm font-semibold text-gray-900">{editTarget ? '투표 수정' : '투표 생성'}</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="투표 제목" className={inputClass} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="설명 (선택)" rows={2} className={`${inputClass} resize-none`} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">시작일시</label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">종료일시</label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={multipleChoice} onChange={(e) => setMultipleChoice(e.target.checked)} className="w-4 h-4 rounded" />
            복수 선택 허용
          </label>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-xl disabled:bg-gray-300 transition-colors">
              {saving ? '저장 중...' : '저장'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              취소
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">투표가 없습니다</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.pollId} className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {item.isActive && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">진행중</span>}
                    {item.isEnded && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">종료</span>}
                    <span className="text-sm font-medium text-gray-900 truncate">{item.title}</span>
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(item.startDate)} ~ {formatDate(item.endDate)} · {item.totalVotes}표 · 선택지 {item.options.length}개</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 items-center">
                  <button
                    onClick={() => setExpandedId(expandedId === item.pollId ? null : item.pollId)}
                    className="text-xs text-blue-400 hover:text-blue-600 transition-colors"
                  >
                    {expandedId === item.pollId ? '접기' : '옵션'}
                  </button>
                  <button onClick={() => openEdit(item)} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">수정</button>
                  <button onClick={() => handleDelete(item.pollId)} className="text-xs text-red-400 hover:text-red-600 transition-colors">삭제</button>
                </div>
              </div>

              {expandedId === item.pollId && (
                <PollOptionsPanel
                  poll={item}
                  token={token}
                  onRefresh={fetchList}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 회원 관리 탭 ───────────────────────────────────────────────────────────────
function MembersTab({ token }: { token: string }) {
  const [items, setItems] = useState<MemberListResDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  const fetchList = async (role = roleFilter) => {
    setLoading(true);
    try {
      const res = await memberApi.adminGetList(token, role ? { role } : undefined);
      setItems(res.result?.content ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRoleFilter = (r: string) => { setRoleFilter(r); fetchList(r); };

  const roleLabels = [
    { value: '', label: '전체' },
    { value: 'USER', label: '일반' },
    { value: 'ROLE_ADMIN', label: '관리자' },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {roleLabels.map((r) => (
          <button
            key={r.value}
            onClick={() => handleRoleFilter(r.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              roleFilter === r.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">회원이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium flex-shrink-0">
                {item.nickname?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{item.nickname}</span>
                  {item.role === 'ROLE_ADMIN' && (
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">관리자</span>
                  )}
                  {!item.isVerified && (
                    <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">미인증</span>
                  )}
                  {item.deletedAt && (
                    <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded">탈퇴</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{item.memberEmail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 메인 관리자 페이지 ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>('reports');

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t || !isAdmin(t)) {
      router.replace('/');
      return;
    }
    setToken(t);
  }, [router]);

  if (!token) return null;

  const tabs: { key: TabType; label: string }[] = [
    { key: 'reports', label: '제보' },
    { key: 'notices', label: '공지사항' },
    { key: 'polls', label: '투표' },
    { key: 'members', label: '회원' },
  ];

  return (
    <div className="px-5 pt-4 pb-10">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">관리자</h1>
        <Link href="/popup/create" className="px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-xl hover:bg-gray-800 transition-colors">
          + 팝업 등록
        </Link>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reports'  && <ReportsTab  token={token} />}
      {tab === 'notices'  && <NoticesTab  token={token} />}
      {tab === 'polls'    && <PollsTab    token={token} />}
      {tab === 'members'  && <MembersTab  token={token} />}
    </div>
  );
}
