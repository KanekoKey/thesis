import type { BlockLayout } from '@/types/block';

// スライドは常にこの論理サイズ(16:9)で描画し、実際の表示サイズは transform: scale() で合わせる。
// これによりエディタ・教員画面・生徒画面・サムネイルのどこでも同じレイアウトになり、スライド内スクロールも発生しない。
export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

// 全ブロック共通の格子。32×18 で1セルが正方形(40px)になる
export const GRID_COLS = 32;
export const GRID_ROWS = 18;
export const CELL_SIZE = SLIDE_WIDTH / GRID_COLS;

export type Span = { colSpan: number; rowSpan: number };
export type Cell = { col: number; row: number };

// 8方向のリサイズハンドル(n=上辺, e=右辺, se=右下角 …)
export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// 2つのブロックが1セルでも重なっているか
export function rectsOverlap(a: BlockLayout, b: BlockLayout): boolean {
  return (
    a.col < b.col + b.colSpan &&
    b.col < a.col + a.colSpan &&
    a.row < b.row + b.rowSpan &&
    b.row < a.row + a.rowSpan
  );
}

export function isInBounds(layout: BlockLayout): boolean {
  return (
    layout.colSpan >= 1 &&
    layout.rowSpan >= 1 &&
    layout.col >= 0 &&
    layout.row >= 0 &&
    layout.col + layout.colSpan <= GRID_COLS &&
    layout.row + layout.rowSpan <= GRID_ROWS
  );
}

// スライド内に収まっていて、他のどのブロックとも重ならないか
export function isPlacementFree(layout: BlockLayout, others: BlockLayout[]): boolean {
  return isInBounds(layout) && !others.some((other) => rectsOverlap(layout, other));
}

// 大きさを保ったまま、位置だけスライド内に収まるようずらす(大きさ自体がスライドを超える場合は切り詰める)
export function clampToBounds(layout: BlockLayout): BlockLayout {
  const colSpan = clamp(layout.colSpan, 1, GRID_COLS);
  const rowSpan = clamp(layout.rowSpan, 1, GRID_ROWS);
  return {
    colSpan,
    rowSpan,
    col: clamp(layout.col, 0, GRID_COLS - colSpan),
    row: clamp(layout.row, 0, GRID_ROWS - rowSpan),
  };
}

// 希望位置に置けなければ、同じ大きさのまま希望位置に最も近い空き位置を返す。空きが全く無ければ null
export function resolvePlacement(desired: BlockLayout, others: BlockLayout[]): BlockLayout | null {
  const target = clampToBounds(desired);
  if (isPlacementFree(target, others)) return target;

  let best: BlockLayout | null = null;
  let bestDistance = Infinity;
  for (let row = 0; row <= GRID_ROWS - target.rowSpan; row++) {
    for (let col = 0; col <= GRID_COLS - target.colSpan; col++) {
      const candidate = { ...target, col, row };
      if (!isPlacementFree(candidate, others)) continue;
      const distance = (col - target.col) ** 2 + (row - target.row) ** 2;
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
  }
  return best;
}

// 今の範囲を含んだまま target の大きさへ広げる。下/右へ広げるのを優先し、
// 空きが無ければ上/左へずらして広げる(広げる量の合計が小さい順)。どこにも置けなければ null
export function growPlacement(current: BlockLayout, target: Span, others: BlockLayout[]): BlockLayout | null {
  const growCols = target.colSpan - current.colSpan;
  const growRows = target.rowSpan - current.rowSpan;

  const shifts: { dCols: number; dRows: number }[] = [];
  for (let dRows = 0; dRows <= growRows; dRows++) {
    for (let dCols = 0; dCols <= growCols; dCols++) {
      shifts.push({ dCols, dRows });
    }
  }
  shifts.sort((a, b) => a.dCols + a.dRows - (b.dCols + b.dRows) || a.dRows - b.dRows);

  for (const { dCols, dRows } of shifts) {
    const candidate = { ...target, col: current.col - dCols, row: current.row - dRows };
    if (isPlacementFree(candidate, others)) return candidate;
  }
  return null;
}

// ポインタ位置(スライド論理座標のセル単位)を中心に据えたときの、ブロックの左上セルを求める
export function centerOnCell(pointer: { x: number; y: number }, span: Span): BlockLayout {
  return clampToBounds({
    ...span,
    col: Math.round(pointer.x / CELL_SIZE - span.colSpan / 2),
    row: Math.round(pointer.y / CELL_SIZE - span.rowSpan / 2),
  });
}

// 移動: セル単位の移動量を加えて、スライド内に収める
export function moveLayout(start: BlockLayout, dCols: number, dRows: number): BlockLayout {
  return clampToBounds({ ...start, col: start.col + dCols, row: start.row + dRows });
}

// リサイズ: 掴んだ辺/角だけを動かし、最小サイズとスライドの端で止める
export function resizeLayout(
  start: BlockLayout,
  handle: ResizeHandle,
  dCols: number,
  dRows: number,
  min: Span
): BlockLayout {
  // 元から最小サイズ未満のブロック(旧データの移行結果など)が、操作した途端に膨らまないようにする
  const minCols = Math.min(min.colSpan, start.colSpan);
  const minRows = Math.min(min.rowSpan, start.rowSpan);

  let left = start.col;
  let right = start.col + start.colSpan;
  let top = start.row;
  let bottom = start.row + start.rowSpan;

  if (handle.includes('w')) left = clamp(left + dCols, 0, right - minCols);
  if (handle.includes('e')) right = clamp(right + dCols, left + minCols, GRID_COLS);
  if (handle.includes('n')) top = clamp(top + dRows, 0, bottom - minRows);
  if (handle.includes('s')) bottom = clamp(bottom + dRows, top + minRows, GRID_ROWS);

  return { col: left, row: top, colSpan: right - left, rowSpan: bottom - top };
}
