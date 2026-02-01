import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`${sizes[size]} font-bold tracking-tight text-gray-900`}>
          <span>POP</span>
          <span className="text-gray-400">UP</span>
        </div>
        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gray-900 rounded-full" />
      </div>
    </Link>
  );
}
