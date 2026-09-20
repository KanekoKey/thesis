'use client';

import FitSlide from '@/components/slide/FitSlide';
import type { SlideData } from '@/types/slide';

// 教員画面のメイン表示。領域いっぱいに16:9のスライドを収める(スクロール無し)
export default function ActiveSlideStage({ slide }: { slide: SlideData }) {
  return (
    <div className="flex-1 min-w-0 min-h-0">
      <FitSlide slide={slide} />
    </div>
  );
}
