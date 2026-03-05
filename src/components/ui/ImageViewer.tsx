'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface ImageViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const lastTap = useRef(0);
  const lastDist = useRef<number | null>(null);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const resetTransform = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // 더블탭: 2배 확대 / 원래대로
  const handleTap = (e: React.MouseEvent) => {
    // 배경 클릭 시 닫기 (scale=1일 때만)
    if ((e.target as HTMLElement).dataset.bg === 'true' && scale === 1) {
      onClose();
      return;
    }

    const now = Date.now();
    if (now - lastTap.current < 300) {
      scale === 1 ? setScale(2) : resetTransform();
    }
    lastTap.current = now;
  };

  // 드래그 (확대 상태에서 이동)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current) return;
    setOffset({
      x: dragStart.current.ox + e.clientX - dragStart.current.x,
      y: dragStart.current.oy + e.clientY - dragStart.current.y,
    });
  };
  const handleMouseUp = () => { dragStart.current = null; };

  // 터치 이벤트 (핀치 줌 + 드래그)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDist.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1 && scale > 1) {
      dragStart.current = {
        x: e.touches[0].clientX, y: e.touches[0].clientY,
        ox: offset.x, oy: offset.y,
      };
    }

    // 더블탭 (터치)
    const now = Date.now();
    if (now - lastTap.current < 300 && e.touches.length === 1) {
      scale === 1 ? setScale(2) : resetTransform();
    }
    lastTap.current = now;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newScale = Math.min(4, Math.max(1, scale * (dist / lastDist.current)));
      setScale(newScale);
      if (newScale <= 1) setOffset({ x: 0, y: 0 });
      lastDist.current = dist;
    } else if (e.touches.length === 1 && dragStart.current) {
      setOffset({
        x: dragStart.current.ox + e.touches[0].clientX - dragStart.current.x,
        y: dragStart.current.oy + e.touches[0].clientY - dragStart.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    lastDist.current = null;
    dragStart.current = null;
    if (scale < 1.1) resetTransform();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-fade-in-overlay"
      data-bg="true"
      onClick={handleTap}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* 줌 리셋 버튼 (확대 상태) */}
      {scale > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); resetTransform(); }}
          className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs hover:bg-black/70 transition-colors"
        >
          원본
        </button>
      )}

      {/* 이미지 */}
      <div
        className="relative w-full h-full"
        style={{
          transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
          transition: dragStart.current ? 'none' : 'transform 0.2s ease',
          cursor: scale > 1 ? 'grab' : 'zoom-in',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="100vw"
          priority
          draggable={false}
        />
      </div>

      {/* 힌트 */}
      {scale === 1 && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs pointer-events-none select-none">
          더블탭으로 확대 · 배경 탭으로 닫기
        </p>
      )}
    </div>
  );
}
