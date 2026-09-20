import type { BlockData, BlockLayout } from '@/types/block';
import { getMinSpan } from './blockSpans';
import { CELL_SIZE, type Span } from './slideGrid';

// GridBlockItem の外側の余白(p-1 の左右/上下の合計)。ブロック本体の大きさ = セルの大きさ - この値
const CELL_PADDING = 8;

// 内容がクリップされている(=一部が見えていない)か。
// テキスト等は Block 側が data-clip を付けた要素で切っているので、その scroll サイズと client サイズを比べる
export function hasOverflow(root: HTMLElement): boolean {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-clip]')).some(
    (el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
  );
}

// ブロック本体(GridBlockItem の data-block-body)を画面外に複製し、指定の大きさにして測る。
// 複製なので、リサイズ操作中の候補サイズでも、実際の表示を動かさずに同期的に判定できる
function measureWithClone<T>(body: HTMLElement, width: number, height: number | null, measure: (clone: HTMLElement) => T): T {
  const clone = body.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    visibility: 'hidden',
    pointerEvents: 'none',
    width: `${width}px`,
    height: height === null ? 'auto' : `${height}px`,
  });
  document.body.appendChild(clone);
  try {
    return measure(clone);
  } finally {
    clone.remove();
  }
}

// このレイアウトの大きさにしたとき、内容が切れずに収まるか
export function contentFits(body: HTMLElement, layout: BlockLayout): boolean {
  return measureWithClone(
    body,
    layout.colSpan * CELL_SIZE - CELL_PADDING,
    layout.rowSpan * CELL_SIZE - CELL_PADDING,
    (clone) => !hasOverflow(clone)
  );
}

// この幅のまま、内容が収まるのに必要な行数(高さを固定せず、内容の自然な高さで測る)
function naturalRows(body: HTMLElement, colSpan: number): number {
  const height = measureWithClone(body, colSpan * CELL_SIZE - CELL_PADDING, null, (clone) => clone.offsetHeight);
  return Math.ceil((height + CELL_PADDING) / CELL_SIZE);
}

// 内容が収まる最小の大きさ。現在の大きさ以上のときだけ意味があり、現在より小さい分は現在の大きさを返す。
// ローラーコースターは内容の高さが枠に応じて伸縮する作りで自然な高さを測れないため、レイアウトごとの固定の下限を使う
export function requiredSpan(block: BlockData, body: HTMLElement, layout: BlockLayout): Span {
  const min = getMinSpan(block);
  const natural = block.type === 'roller-coaster' ? 0 : naturalRows(body, layout.colSpan);
  return {
    colSpan: Math.max(layout.colSpan, min.colSpan),
    rowSpan: Math.max(layout.rowSpan, min.rowSpan, natural),
  };
}
