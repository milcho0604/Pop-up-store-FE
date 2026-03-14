type EmptyStateType = 'search' | 'favorites' | 'notifications' | 'posts';

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  className?: string;
}

const defaultContent: Record<EmptyStateType, { title: string; description: string }> = {
  search: { title: '검색 결과가 없어요', description: '다른 키워드로 검색해보세요' },
  favorites: { title: '즐겨찾기가 없어요', description: '마음에 드는 팝업을 저장해보세요' },
  notifications: { title: '알림이 없어요', description: '새로운 소식을 기다려보세요' },
  posts: { title: '팝업이 없어요', description: '첫 번째 팝업을 기다려보세요' },
};

function SearchIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-44 h-36">
      {/* Shadow */}
      <ellipse cx="90" cy="149" rx="50" ry="7" fill="#f3f4f6" />
      {/* Lens */}
      <circle cx="80" cy="72" r="38" stroke="#e5e7eb" strokeWidth="5" fill="#fafafa" />
      {/* 3 dots inside (nothing found) */}
      <circle cx="68" cy="72" r="4" fill="#e5e7eb" />
      <circle cx="80" cy="72" r="4" fill="#e5e7eb" />
      <circle cx="92" cy="72" r="4" fill="#e5e7eb" />
      {/* Handle */}
      <line x1="108" y1="100" x2="147" y2="139" stroke="#e5e7eb" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

function FavoritesIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-44 h-36">
      {/* Shadow */}
      <ellipse cx="100" cy="149" rx="54" ry="7" fill="#f3f4f6" />
      {/* Heart */}
      <path
        d="M100,118 C87,105 52,88 52,65 C52,45 66,36 80,36 C88,36 96,40 100,50 C104,40 112,36 120,36 C134,36 148,45 148,65 C148,88 113,105 100,118 Z"
        stroke="#e5e7eb"
        strokeWidth="4"
        fill="#fafafa"
      />
      {/* Sparkle top-right */}
      <line x1="157" y1="33" x2="157" y2="51" stroke="#e5e7eb" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="148" y1="42" x2="166" y2="42" stroke="#e5e7eb" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="151" y1="37" x2="163" y2="47" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="163" y1="37" x2="151" y2="47" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" />
      {/* Sparkle top-left */}
      <line x1="40" y1="47" x2="40" y2="59" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
      <line x1="34" y1="53" x2="46" y2="53" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
      {/* Dot accents */}
      <circle cx="170" cy="82" r="4" fill="#efefef" />
      <circle cx="28"  cy="80" r="3" fill="#efefef" />
      <circle cx="100" cy="20" r="3" fill="#efefef" />
    </svg>
  );
}

function NotificationsIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-44 h-36">
      {/* Shadow */}
      <ellipse cx="100" cy="149" rx="46" ry="7" fill="#f3f4f6" />
      {/* Bell hanger */}
      <path
        d="M95,36 L95,26 Q95,20 100,20 Q105,20 105,26 L105,36"
        stroke="#e5e7eb"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Bell body */}
      <path
        d="M62,110 C50,82 64,44 100,36 C136,44 150,82 138,110 Z"
        fill="#f5f5f5"
        stroke="#e5e7eb"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* Bell rim (curved) */}
      <path
        d="M55,110 Q100,124 145,110"
        stroke="#e5e7eb"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Clapper */}
      <circle cx="100" cy="130" r="7" stroke="#e5e7eb" strokeWidth="3.5" fill="white" />
      {/* ZZZ (ascending right) */}
      <path d="M144,82 H156 L144,94 H156" stroke="#e5e7eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M151,66 H161 L151,76 H161" stroke="#e5e7eb" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M157,52 H165 L157,60 H165" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function PostsIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-44 h-36">
      {/* Shadow */}
      <ellipse cx="100" cy="149" rx="50" ry="7" fill="#f3f4f6" />
      {/* Awning */}
      <path
        d="M48,84 L100,54 L152,84 Z"
        fill="#f3f4f6"
        stroke="#e5e7eb"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Store body */}
      <rect x="60" y="84" width="80" height="58" rx="4" fill="#fafafa" stroke="#e5e7eb" strokeWidth="3.5" />
      {/* Door */}
      <rect x="86" y="108" width="28" height="34" rx="3" stroke="#e5e7eb" strokeWidth="3" fill="none" />
      {/* Left window */}
      <rect x="66" y="92" width="16" height="13" rx="2" stroke="#e5e7eb" strokeWidth="2.5" fill="none" />
      {/* Right window */}
      <rect x="118" y="92" width="16" height="13" rx="2" stroke="#e5e7eb" strokeWidth="2.5" fill="none" />
      {/* Sparkle right */}
      <line x1="158" y1="50" x2="158" y2="64" stroke="#e5e7eb" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="151" y1="57" x2="165" y2="57" stroke="#e5e7eb" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="153" y1="52" x2="163" y2="62" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="163" y1="52" x2="153" y2="62" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" />
      {/* Sparkle left */}
      <line x1="42" y1="66" x2="42" y2="76" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
      <line x1="37" y1="71" x2="47" y2="71" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
      {/* Dot accents */}
      <circle cx="172" cy="82" r="4" fill="#efefef" />
      <circle cx="28"  cy="90" r="3" fill="#efefef" />
      <circle cx="100" cy="40" r="3" fill="#efefef" />
    </svg>
  );
}

const illustrations: Record<EmptyStateType, React.ReactNode> = {
  search:        <SearchIllustration />,
  favorites:     <FavoritesIllustration />,
  notifications: <NotificationsIllustration />,
  posts:         <PostsIllustration />,
};

export default function EmptyState({ type, title, description, className = '' }: EmptyStateProps) {
  const content = defaultContent[type];

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      {illustrations[type]}
      <p className="mt-4 text-base font-medium text-gray-600">{title ?? content.title}</p>
      <p className="mt-1 text-sm text-gray-400">{description ?? content.description}</p>
    </div>
  );
}