'use client';

import { useEffect, useState } from 'react';
import { memberApi } from '@/lib/member';
import { MemberListResDto } from '@/types/member';

export default function MembersTab({ token }: { token: string }) {
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
