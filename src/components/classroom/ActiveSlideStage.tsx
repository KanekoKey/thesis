'use client';

import Block from '@/components/blocks/Block';
import type { SlideData } from '@/types/slide';

export default function ActiveSlideStage({ slide }: { slide: SlideData }) {
  return (
    <div className="flex-1 flex items-center justify-center min-w-0">
      <div className="w-full h-full max-w-5xl bg-white p-10 rounded-3xl shadow-lg border border-gray-100 flex flex-col justify-center overflow-auto">
        <div className="flex flex-col gap-6">
          {slide.blocks.map((block) => (
            <div key={block.id} className="w-full">
              <Block block={block} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
