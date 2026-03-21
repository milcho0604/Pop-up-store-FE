'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import ReportsTab from './_components/ReportsTab';
import NoticesTab from './_components/NoticesTab';
import PollsTab from './_components/PollsTab';
import MembersTab from './_components/MembersTab';
import QABotTab from './_components/QABotTab';

type TabType = 'reports' | 'notices' | 'polls' | 'members' | 'qa';

export default function AdminPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  });
  const [tab, setTab] = useState<TabType>('reports');

  useEffect(() => {
    if (!token || !isAdmin(token)) {
      router.replace('/');
    }
  }, [router, token]);

  if (!token) return null;

  const tabs: { key: TabType; label: string }[] = [
    { key: 'reports', label: '제보' },
    { key: 'notices', label: '공지사항' },
    { key: 'polls', label: '투표' },
    { key: 'members', label: '회원' },
    { key: 'qa', label: 'QA봇' },
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
      {tab === 'qa'       && <QABotTab    token={token} />}
    </div>
  );
}
