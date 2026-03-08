'use client';

import { useState } from 'react';
import Image from 'next/image';
import { InformationListDto } from '@/types/member';
import DefaultImage from '@/components/ui/DefaultImage';

const statusLabel: Record<string, { text: string; color: string }> = {
  PENDING: { text: '대기', color: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { text: '승인', color: 'bg-green-100 text-green-700' },
  REJECTED: { text: '반려', color: 'bg-red-100 text-red-700' },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}.${d}`;
}

export default function ReportCard({ report }: { report: InformationListDto }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = report.postImgUrl && !imgError;
  const status = statusLabel[report.status] ?? statusLabel.PENDING;

  return (
    <div className="flex gap-4">
      <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
        {hasImage ? (
          <Image
            src={report.postImgUrl}
            alt={report.title}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            sizes="96px"
          />
        ) : (
          <DefaultImage className="w-full h-full" />
        )}
      </div>
      <div className="flex flex-col justify-center min-w-0">
        <span className={`self-start px-2 py-0.5 rounded text-[10px] font-medium mb-1.5 ${status.color}`}>
          {status.text}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 truncate">{report.title}</h3>
        <p className="text-xs text-gray-400 mt-1">{report.city} {report.dong}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDate(report.startDate)} - {formatDate(report.endDate)}
        </p>
      </div>
    </div>
  );
}
