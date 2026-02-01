interface DividerProps {
  text?: string;
  className?: string;
}

export default function Divider({ text, className = '' }: DividerProps) {
  if (!text) {
    return <hr className={`border-gray-100 ${className}`} />;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 font-medium">{text}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}
