'use client';

import Block from '@/components/blocks/Block';
import type { SlideData } from '@/types/slide';

// 実寸のスライドを transform: scale() で縮小して見せる（エディタのサムネイルと同じ方式）
export const SLIDE_W = 1024;
export const SLIDE_H = 576;

export default function ScaledSlide({ slide, width }: { slide: SlideData; width: number }) {
  const height = (width * SLIDE_H) / SLIDE_W;
  const scale = width / SLIDE_W;

  return (
    <div className="relative overflow-hidden bg-white" style={{ width, height }}>
      <div
        className="absolute top-0 left-0 origin-top-left pointer-events-none flex flex-col gap-2 p-8"
        style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})` }}
      >
        {slide.blocks.map((block) => (
          <div key={block.id} className="relative p-4">
            {/* サムネイル表示なので操作UI(権限バッジ等)は出さない。button-in-buttonのHTML違反も避けられる */}
            <Block block={block} interactive={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
