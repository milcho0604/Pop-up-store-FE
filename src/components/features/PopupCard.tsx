'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { PostListDto } from '@/types/post';
import StatusBadge from '@/components/ui/StatusBadge';
import DefaultImage from '@/components/ui/DefaultImage';

interface PopupCardProps {
  post: PostListDto;
  variant?: 'vertical' | 'horizontal';
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}.${d}`;
}

export default function PopupCard({ post, variant = 'vertical' }: PopupCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage = post.postImgUrl && !imgError;

  if (variant === 'horizontal') {
    return (
      <Link href={`/popup/${post.id}`} className="flex gap-4 group">
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
          {hasImage ? (
            <Image
              src={post.postImgUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
              sizes="96px"
            />
          ) : (
            <DefaultImage className="w-full h-full" />
          )}
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <StatusBadge status={post.status} className="self-start mb-1.5" />
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {post.title}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {post.city} {post.dong}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(post.startDate)} - {formatDate(post.endDate)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/popup/${post.id}`} className="group block">
      <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden">
        {hasImage ? (
          <Image
            src={post.postImgUrl}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <DefaultImage className="w-full h-full" />
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge status={post.status} />
        </div>
      </div>
      <div className="mt-3 px-0.5">
        <h3 className="text-sm font-semibold text-gray-900 truncate">
          {post.title}
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          {post.city} {post.dong}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {post.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {post.viewCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
