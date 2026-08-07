'use client';

import { useRef } from 'react';
import ScaledSlide from './ScaledSlide';
import type { SlideData } from '@/types/slide';

const THUMB_WIDTH = 96;

interface SlideFilmstripProps {
  slides: SlideData[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export default function SlideFilmstrip({ slides, activeIndex, onSelect }: SlideFilmstripProps) {
  const filmstripRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!filmstripRef.current) return;
    isDraggingRef.current = true;
    didDragRef.current = false;
    dragStartXRef.current = e.pageX;
    dragStartScrollLeftRef.current = filmstripRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !filmstripRef.current) return;
    const delta = e.pageX - dragStartXRef.current;
    if (Math.abs(delta) > 5) didDragRef.current = true;
    filmstripRef.current.scrollLeft = dragStartScrollLeftRef.current - delta;
  };

  const stopDrag = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      ref={filmstripRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      onDragStart={(e) => e.preventDefault()}
      className="shrink-0 bg-white border-t border-gray-200 px-4 py-3 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing select-none"
    >
      <div className="flex gap-3 w-max">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => {
              if (didDragRef.current) return;
              onSelect(index);
            }}
            className={`relative shrink-0 rounded-lg border-2 overflow-hidden transition-colors ${
              index === activeIndex
                ? 'border-blue-500 ring-2 ring-blue-200/50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <ScaledSlide slide={slide} width={THUMB_WIDTH} />
            <span className="absolute bottom-0.5 right-0.5 bg-black/50 text-white text-[10px] leading-none px-1 py-0.5 rounded">
              {index + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
