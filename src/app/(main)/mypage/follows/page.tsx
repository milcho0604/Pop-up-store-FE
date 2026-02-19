'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { followApi } from '@/lib/follow';
import { FollowDto } from '@/types/member';
import LoginPrompt from '@/components/ui/LoginPrompt';

type Tab = 'followers' | 'followings';

function FollowsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get('tab') as Tab) || 'followers';

  const [tab, setTab] = useState<Tab>(initialTab);
  const [followers, setFollowers] = useState<FollowDto[]>([]);
  const [followings, setFollowings] = useState<FollowDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [unfollowingId, setUnfollowingId] = useState<number | null>(null);

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setShowLogin(true);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const [fwersRes, fwingsRes] = await Promise.all([
          followApi.getMyFollowers(token),
          followApi.getMyFollowings(token),
        ]);
        setFollowers(fwersRes.result ?? []);
        setFollowings(fwingsRes.result ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleUnfollow = async (memberId: number) => {
    const token = getToken();
    if (!token) return;

    setUnfollowingId(memberId);
    try {
      await followApi.unfollow(memberId, token);
      setFollowings((prev) => prev.filter((f) => f.memberId !== memberId));
    } catch {
      // ignore
    } finally {
      setUnfollowingId(null);
    }
  };

  const list = tab === 'followers' ? followers : followings;

  return (
    <>
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {tab === 'followers' ? '팔로워' : '팔로잉'}
          </h1>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            뒤로
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('followers')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              tab === 'followers' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            팔로워 {followers.length}
          </button>
          <button
            onClick={() => setTab('followings')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              tab === 'followings' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            팔로잉 {followings.length}
          </button>
        </div>

        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded w-24" />
                  <div className="h-3 bg-gray-100 rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && list.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-16">
            {tab === 'followers' ? '팔로워가 없습니다.' : '팔로잉하는 사용자가 없습니다.'}
          </p>
        )}

        {!loading && list.length > 0 && (
          <div className="space-y-4">
            {list.map((user) => (
              <div key={user.followId} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {user.profileImgUrl ? (
                    <img src={user.profileImgUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                      {user.memberNickname?.charAt(0) ?? '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.memberNickname}</p>
                  <p className="text-xs text-gray-400 truncate">{user.memberEmail}</p>
                </div>
                {tab === 'followings' && (
                  <button
                    onClick={() => handleUnfollow(user.memberId)}
                    disabled={unfollowingId === user.memberId}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    {unfollowingId === user.memberId ? '...' : '언팔로우'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <LoginPrompt open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}

export default function FollowsPage() {
  return (
    <Suspense fallback={<div className="px-5 pt-4"><div className="h-8 bg-gray-100 rounded w-20 animate-pulse" /></div>}>
      <FollowsContent />
    </Suspense>
  );
}
