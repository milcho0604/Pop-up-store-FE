'use client';

import { useEffect, useState, FormEvent } from 'react';
import { pollApi, PollSaveDto } from '@/lib/poll';
import { PollResDto } from '@/types/poll';
import { formatDate, toDatetimeLocal, fromDatetimeLocal } from './adminUtils';
import PollOptionsPanel from './PollOptionsPanel';

export default function PollsTab({ token }: { token: string }) {
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
