'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { memberApi } from '@/lib/member';
import { followApi } from '@/lib/follow';
import { postApi } from '@/lib/post';
import { MemberProfileResDto, FollowStatsDto } from '@/types/member';
import { PostListDto } from '@/types/post';
import { getTokenMemberId } from '@/lib/auth';
import PopupCard from '@/components/features/PopupCard';

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const memberId = Number(id);
  const router = useRouter();

  const [profile, setProfile] = useState<MemberProfileResDto | null>(null);
  const [stats, setStats] = useState<FollowStatsDto | null>(null);
  const [posts, setPosts] = useState<PostListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);

    const fetchAll = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          memberApi.getProfileById(memberId),
          followApi.getStats(memberId),
        ]);
        setProfile(profileRes.result ?? null);
        setStats(statsRes.result ?? null);

        if (t) {
          const myId = getTokenMemberId(t);
          if (myId === memberId) {
            setIsOwnProfile(true);
          } else {
            try {
              const checkRes = await followApi.check(memberId, t);
              setFollowing(checkRes.result === true);
            } catch {
              setFollowing(false);
            }
          }
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [memberId]);

  // 팝업 목록 로드
  useEffect(() => {
    if (!profile) return;
    setPostsLoading(true);
    postApi.getListByMember(memberId)
      .then((res) => setPosts(res.result ?? []))
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [profile, memberId]);

  const handleFollow = async () => {
    if (!token) { router.push('/login'); return; }
    setFollowLoading(true);
    try {
      if (following) {
        await followApi.unfollow(memberId, token);
        setFollowing(false);
        setStats((prev) => prev ? { ...prev, followerCount: prev.followerCount - 1 } : prev);
      } else {
        await followApi.follow(memberId, token);
        setFollowing(true);
        setStats((prev) => prev ? { ...prev, followerCount: prev.followerCount + 1 } : prev);
      }
    } catch {
      /* ignore */
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-5 pt-4 animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
          </div>
        </div>
        <div className="flex gap-8 mb-6">
          <div className="h-10 bg-gray-100 rounded w-20" />
          <div className="h-10 bg-gray-100 rounded w-20" />
        </div>
        <div className="h-10 bg-gray-100 rounded-xl w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-5">
        <p className="text-sm text-gray-400 mb-3">존재하지 않는 사용자입니다</p>
        <button onClick={() => router.back()} className="text-sm font-medium text-gray-900 hover:underline">
          뒤로가기
        </button>
      </div>
    );
  }

  const hasImage = profile.profileImgUrl && !imgError;

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-5 pt-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 transition-colors mb-5 block">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* 프로필 */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
            {hasImage ? (
              <Image
                src={profile.profileImgUrl}
                alt={profile.nickname}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{profile.nickname}</h1>
            {profile.city && (
              <p className="text-xs text-gray-400 mt-0.5">{profile.city}</p>
            )}
          </div>
        </div>

        {/* 팔로우 통계 */}
        <div className="flex gap-8 mb-5">
          <div className="text-center">
            <p className="text-base font-bold text-gray-900">{stats?.followerCount ?? 0}</p>
            <p className="text-xs text-gray-400">팔로워</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-gray-900">{stats?.followingCount ?? 0}</p>
            <p className="text-xs text-gray-400">팔로잉</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-gray-900">{posts.length}</p>
            <p className="text-xs text-gray-400">팝업</p>
          </div>
        </div>

        {/* 팔로우 버튼 */}
        {!isOwnProfile && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors mb-5 ${
              following
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            } disabled:opacity-50`}
          >
            {followLoading ? '...' : following ? '팔로잉' : '팔로우'}
          </button>
        )}

        {isOwnProfile && (
          <button
            onClick={() => router.push('/mypage')}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors mb-5"
          >
            내 프로필로 이동
          </button>
        )}

        {/* 구분선 */}
        <div className="border-t border-gray-100 mb-5" />
        <p className="text-sm font-semibold text-gray-900 mb-4">등록한 팝업</p>
      </div>

      {/* 팝업 목록 */}
      <div className="px-5">
        {postsLoading ? (
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-24 h-24 rounded-2xl bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                  <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">등록한 팝업이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <PopupCard key={post.id} post={post} variant="horizontal" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
