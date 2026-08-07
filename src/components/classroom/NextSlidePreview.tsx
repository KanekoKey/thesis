'use client';

import ScaledSlide, { SLIDE_H, SLIDE_W } from './ScaledSlide';
import type { SlideData } from '@/types/slide';

const PREVIEW_WIDTH = 272;

export default function NextSlidePreview({ slide }: { slide: SlideData | undefined }) {
  return (
    <aside className="w-72 shrink-0 flex flex-col gap-2">
      <p className="text-sm font-bold text-gray-500">次のスライド</p>
      {slide ? (
        <div className="rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden bg-white">
          <ScaledSlide slide={slide} width={PREVIEW_WIDTH} />
        </div>
      ) : (
        <div
          className="rounded-xl border-2 border-dashed border-gray-200 bg-white flex items-center justify-center text-gray-400 text-sm"
          style={{ width: PREVIEW_WIDTH, height: (PREVIEW_WIDTH * SLIDE_H) / SLIDE_W }}
        >
          これが最後のスライドです
        </div>
      )}
    </aside>
  );
}
