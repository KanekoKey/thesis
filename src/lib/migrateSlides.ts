import type { BlockData, BlockLayout, BlockType } from '@/types/block';
import type { SlideData } from '@/types/slide';
import { GRID_COLS, GRID_ROWS, type Span } from './slideGrid';
import { getDefaultSpan } from './blockSpans';

// グリッド導入前に保存されたデッキは、ブロックが layout を持たず、縦積み+「2列ブロック」で構成されている。
// 読み込み時にそれを新形式(全ブロックがグリッド上の位置を持つ・2列ブロックは廃止)へ変換する。
// 変換済みのデータ(全ブロックが layout を持つ)はそのまま返すので、何度通しても結果は変わらない。

type LegacyBlock = {
  id: string;
  type: string;
  parameters: Record<string, unknown>;
  layout?: BlockLayout;
};

type LegacyTwoColumn = LegacyBlock & {
  type: 'two-column';
  parameters: { columns: [LegacyBlock[], LegacyBlock[]]; ratio: number };
};

const isTwoColumn = (block: LegacyBlock): block is LegacyTwoColumn => block.type === 'two-column';

// 旧レイアウトでは全幅だったテキスト系は、新レイアウトでも左右1セルの余白を残して全幅にする
const FULL_WIDTH_TYPES: string[] = ['text', 'h1', 'h2', 'h3', 'h4'];
const MARGIN_COLS = 1;
// 旧2列ブロックの左右の列の間に空けるセル数
const COLUMN_GAP_COLS = 1;

// 縦に積んだときにそのブロックが占める行数(2列ブロックは高い方の列に合わせる)
function naturalRows(block: LegacyBlock): number {
  if (isTwoColumn(block)) {
    const [left, right] = block.parameters.columns;
    return Math.max(stackRows(left), stackRows(right));
  }
  return getDefaultSpan(block.type as BlockType).rowSpan;
}

function stackRows(blocks: LegacyBlock[]): number {
  return blocks.reduce((sum, block) => sum + naturalRows(block), 0);
}

// blocks を幅 width・左端 col の領域に縦積みして配置し、2列ブロックは左右に分けて平坦なブロック配列にする。
// scale は、全体が18行に収まらない場合に行数を縮めるための倍率
function placeStack(blocks: LegacyBlock[], col: number, width: number, startRow: number, scale: number): BlockData[] {
  const placed: BlockData[] = [];
  let row = startRow;

  for (const block of blocks) {
    const rows = Math.max(1, Math.floor(naturalRows(block) * scale));

    if (isTwoColumn(block)) {
      const [left, right] = block.parameters.columns;
      const usable = Math.max(2, width - COLUMN_GAP_COLS);
      const leftWidth = Math.min(usable - 1, Math.max(1, Math.round(usable * block.parameters.ratio)));
      placed.push(
        ...placeStack(left, col, leftWidth, row, scale),
        ...placeStack(right, col + leftWidth + COLUMN_GAP_COLS, usable - leftWidth, row, scale)
      );
    } else {
      const span: Span = getDefaultSpan(block.type as BlockType);
      const colSpan = FULL_WIDTH_TYPES.includes(block.type) ? width : Math.min(span.colSpan, width);
      // 収まりきらない分は最終行に詰める(重なりは許容。以降の編集で整えてもらう)
      const clampedRow = Math.min(row, GRID_ROWS - 1);
      const layout: BlockLayout = {
        col,
        row: clampedRow,
        colSpan,
        rowSpan: Math.max(1, Math.min(rows, GRID_ROWS - clampedRow)),
      };
      placed.push({ ...block, layout } as unknown as BlockData);
    }

    row += rows;
  }

  return placed;
}

function migrateSlide(slide: SlideData): SlideData {
  const legacyBlocks = slide.blocks as unknown as LegacyBlock[];
  const isMigrated = legacyBlocks.every((block) => block.layout && !isTwoColumn(block));
  if (isMigrated) return slide;

  const total = stackRows(legacyBlocks);
  const scale = total > GRID_ROWS ? GRID_ROWS / total : 1;
  return {
    ...slide,
    blocks: placeStack(legacyBlocks, MARGIN_COLS, GRID_COLS - MARGIN_COLS * 2, 0, scale),
  };
}

export function migrateSlides(slides: SlideData[]): SlideData[] {
  return slides.map(migrateSlide);
}
