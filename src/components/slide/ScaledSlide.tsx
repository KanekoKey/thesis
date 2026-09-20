'use client';

import SlideSurface from './SlideSurface';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '@/lib/slideGrid';
import type { SlideData } from '@/types/slide';

// 論理サイズのスライドを transform: scale() で縮小して見せる(サムネイル・次スライドプレビュー用)
export default function ScaledSlide({ slide, width }: { slide: SlideData; width: number }) {
  const height = (width * SLIDE_HEIGHT) / SLIDE_WIDTH;
  const scale = width / SLIDE_WIDTH;

  return (
    <div className="relative overflow-hidden bg-white" style={{ width, height }}>
      {/* サムネイル表示なので操作UI(権限バッジ等)は出さない。button-in-buttonのHTML違反も避けられる */}
      <div className="absolute top-0 left-0 origin-top-left pointer-events-none" style={{ transform: `scale(${scale})` }}>
        <SlideSurface blocks={slide.blocks} interactive={false} />
      </div>
    </div>
  );
}
