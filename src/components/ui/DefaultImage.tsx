interface DefaultImageProps {
  className?: string;
}

export default function DefaultImage({ className = '' }: DefaultImageProps) {
  return (
    <div
      className={`flex items-center justify-center bg-gray-100 ${className}`}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-gray-300"
      >
        <rect
          x="6"
          y="10"
          width="36"
          height="28"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="17" cy="21" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M6 32l10-8 6 5 8-6 12 9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
