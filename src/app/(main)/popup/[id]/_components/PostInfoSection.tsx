import { PostDetailDto } from '@/types/post';
import KakaoMap from '@/components/features/KakaoMap';

const DAY_LABELS: Record<string, string> = {
  MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수',
  THURSDAY: '목', FRIDAY: '금', SATURDAY: '토', SUNDAY: '일',
  Monday: '월', Tuesday: '화', Wednesday: '수',
  Thursday: '목', Friday: '금', Saturday: '토', Sunday: '일',
  monday: '월', tuesday: '화', wednesday: '수',
  thursday: '목', friday: '금', saturday: '토', sunday: '일',
  월: '월', 화: '화', 수: '수', 목: '목', 금: '금', 토: '토', 일: '일',
};

interface Props {
  post: PostDetailDto;
  startDate: string;
  endDate: string;
  address: string;
}

export default function PostInfoSection({ post, startDate, endDate, address }: Props) {
  return (
    <div className="mt-5 space-y-4">
      {/* Period */}
      {(startDate || endDate) && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400">기간</p>
            <p className="text-sm text-gray-900 font-medium">
              {startDate && endDate
                ? `${startDate} ~ ${endDate}`
                : startDate || endDate}
            </p>
          </div>
        </div>
      )}

      {/* Location */}
      {address && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400">위치</p>
            <p className="text-sm text-gray-900 font-medium">{address}</p>
          </div>
        </div>
      )}

      {/* Kakao Map */}
      {address && (
        <KakaoMap address={address} title={post.title} />
      )}

      {/* Operating Hours */}
      {post.businessInfo?.operatingHours && Object.keys(post.businessInfo.operatingHours).length > 0 && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400">운영시간</p>
            <div className="mt-1 space-y-0.5">
              {Object.entries(post.businessInfo.operatingHours).map(([day, hours]) => {
                const label = DAY_LABELS[day] ?? day.slice(0, 2);
                return (
                  <div key={day} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 w-6">{label}</span>
                    {hours.closed ? (
                      <span className="text-gray-300">휴무</span>
                    ) : (
                      <span className="text-gray-900">
                        {hours.open ?? '-'} - {hours.close ?? '-'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Entry Fee */}
      {post.businessInfo?.entryFee && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400">입장료</p>
            <p className="text-sm text-gray-900 font-medium">{post.businessInfo.entryFee}</p>
          </div>
        </div>
      )}

      {/* Subway */}
      {post.businessInfo?.nearbySubway && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="16" height="14" rx="2" />
              <line x1="4" y1="11" x2="20" y2="11" />
              <line x1="9" y1="21" x2="6" y2="17" />
              <line x1="15" y1="21" x2="18" y2="17" />
              <circle cx="9" cy="14" r="1" fill="#9ca3af" />
              <circle cx="15" cy="14" r="1" fill="#9ca3af" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400">가까운 지하철</p>
            <p className="text-sm text-gray-900 font-medium">
              {post.businessInfo.nearbySubway}
              {post.businessInfo.nearbySubwayExit && ` ${post.businessInfo.nearbySubwayExit}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
