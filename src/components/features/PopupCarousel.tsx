'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PostListDto } from '@/types/post';
import PopupCard from './PopupCard';

interface PopupCarouselProps {
  posts: PostListDto[];
  maxItems?: number;
  autoPlayInterval?: number;
}

export default function PopupCarousel({
  posts,
  maxItems = 10,
  autoPlayInterval = 3000,
}: PopupCarouselProps) {
  const items = posts.slice(0, maxItems);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrolling = useRef(false);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.children[index] as HTMLElement | undefined;
    if (!card) return;
    container.scrollTo({
      left: card.offsetLeft - 20,
      behavior: 'smooth',
    });
  }, []);

  const startAutoPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isUserScrolling.current) return;
      setActiveIndex((prev) => {
        const next = prev + 1 >= items.length ? 0 : prev + 1;
        scrollToIndex(next);
        return next;
      });
    }, autoPlayInterval);
  }, [items.length, autoPlayInterval, scrollToIndex]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoPlay]);

  const handleScrollEnd = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    let closestIndex = 0;
    let closestDist = Infinity;

    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i] as HTMLElement;
      const dist = Math.abs(child.offsetLeft - 20 - scrollLeft);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    setActiveIndex(closestIndex);
    isUserScrolling.current = false;
    startAutoPlay();
  }, [startAutoPlay]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      isUserScrolling.current = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollEnd, 150);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      clearTimeout(scrollTimeout);
    };
  }, [handleScrollEnd]);

  const handleTouchStart = () => {
    isUserScrolling.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  if (items.length === 0) return null;

  return (
    <div>
      <div
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onMouseDown={handleTouchStart}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-5 -mx-5 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((post) => (
          <div
            key={post.id}
            className="flex-shrink-0 w-[60vw] max-w-[240px] snap-start"
          >
            <PopupCard post={post} />
          </div>
        ))}
        {/* End spacer */}
        <div className="flex-shrink-0 w-1" />
      </div>

      {/* Indicator dots */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveIndex(i);
                scrollToIndex(i);
                startAutoPlay();
              }}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-5 h-1.5 bg-gray-900'
                  : 'w-1.5 h-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
