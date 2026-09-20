import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import SlideSurface from '@/components/slide/SlideSurface';
import type { BlockData } from '@/types/block';
import { hasOverflow } from './contentFit';

// 表示中でないスライドも含めて、内容が枠に切れているブロックのIDを調べる(保存前のチェック用)。
// エディタが測れるのは表示中のスライドだけなので、対象のスライドを画面外に一度だけ描画して測る。
// SlideSurface はエディタと同じ枠・余白でブロックを包むため、判定結果はエディタ上のはみ出しと一致する
export function findOverflowingBlockIds(blocks: BlockData[]): string[] {
  if (blocks.length === 0) return [];

  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    visibility: 'hidden',
    pointerEvents: 'none',
  });
  document.body.appendChild(container);

  const root = createRoot(container);
  try {
    flushSync(() => root.render(createElement(SlideSurface, { blocks, interactive: false })));
    // SlideGrid の子が、blocks と同じ順のセル
    const cells = Array.from(container.firstElementChild?.children ?? []) as HTMLElement[];
    return blocks.filter((_, i) => cells[i] && hasOverflow(cells[i])).map((block) => block.id);
  } finally {
    root.unmount();
    container.remove();
  }
}
