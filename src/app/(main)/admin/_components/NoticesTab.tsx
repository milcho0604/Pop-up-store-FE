'use client';

import { useEffect, useState, FormEvent } from 'react';
import { noticeApi, NoticeSaveDto } from '@/lib/notice';
import { NoticeResDto } from '@/types/notice';
import { formatDate, toDatetimeLocal, fromDatetimeLocal } from './adminUtils';

export default function NoticesTab({ token }: { token: string }) {
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
