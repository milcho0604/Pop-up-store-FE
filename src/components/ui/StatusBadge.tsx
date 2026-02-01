interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

const statusConfig: Record<string, { label: string; style: string }> = {
  ONGOING: { label: '진행중', style: 'bg-green-50 text-green-600' },
  UPCOMING: { label: '예정', style: 'bg-blue-50 text-blue-600' },
  ENDED: { label: '종료', style: 'bg-gray-100 text-gray-400' },
};

const defaultConfig = { label: '정보없음', style: 'bg-gray-100 text-gray-400' };

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = (status && statusConfig[status]) || defaultConfig;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.style} ${className}`}
    >
      {config.label}
    </span>
  );
}
