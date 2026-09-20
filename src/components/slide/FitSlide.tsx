'use client';

import { useRef } from 'react';
import { useFitScale } from '@/hooks/useFitScale';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '@/lib/slideGrid';
import SlideSurface from './SlideSurface';
import type { SlideData } from '@/types/slide';

// 親要素いっぱいに、16:9を保ったままスライドを拡大縮小して表示する(はみ出さないのでスクロールも出ない)。
// 親要素は高さが確定していること(flex-1 min-h-0 など)
export default function FitSlide({ slide }: { slide: SlideData }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(areaRef);

  return (
    <div ref={areaRef} className="w-full h-full min-w-0 min-h-0 flex items-center justify-center">
      {scale > 0 && (
        <div
          className="relative bg-white shadow-lg border border-gray-200 shrink-0"
          style={{ width: SLIDE_WIDTH * scale, height: SLIDE_HEIGHT * scale }}
        >
          <div className="absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
            <SlideSurface blocks={slide.blocks} />
          </div>
        </div>
      )}
    </div>
  );
}
