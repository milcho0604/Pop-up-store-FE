'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FavoriteResDto } from '@/types/member';
import DefaultImage from '@/components/ui/DefaultImage';

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}.${d}`;
}

export default function FavoriteCard({ favorite }: { favorite: FavoriteResDto }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = favorite.postImgUrl && !imgError;

  return (
    <Link href={`/popup/${favorite.postId}`} className="flex gap-4 group">
      <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
        {hasImage ? (
          <Image
            src={favorite.postImgUrl}
            alt={favorite.postTitle}
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
        <h3 className="text-sm font-semibold text-gray-900 truncate">{favorite.postTitle}</h3>
        <p className="text-xs text-gray-400 mt-1">{favorite.city}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDate(favorite.startDate)} - {formatDate(favorite.endDate)}
        </p>
      </div>
    </Link>
  );
}
