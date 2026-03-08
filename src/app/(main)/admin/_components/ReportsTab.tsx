'use client';

import { useEffect, useState } from 'react';
import { informationApi } from '@/lib/information';
import { InformationListDto } from '@/types/member';
import { timeAgo } from '@/lib/time';
import { statusLabel } from './adminUtils';

export default function ReportsTab({ token }: { token: string }) {
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
