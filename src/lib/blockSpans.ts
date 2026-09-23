import type { BlockData, BlockType, RollerCoasterLayout } from '@/types/block';
import type { Span } from './slideGrid';

// 新規追加時の初期サイズ(セル数)。1セル=40pxなので、例えば見出し1は 24×2 = 960×80px。
// 実際の描画サイズに対して内容が多すぎる場合は、エディタ側で「はみ出し」警告が出る
const DEFAULT_SPANS: Record<BlockType, Span> = {
  'h1': { colSpan: 24, rowSpan: 2 },
  'h2': { colSpan: 24, rowSpan: 2 },
  'h3': { colSpan: 20, rowSpan: 2 },
  'h4': { colSpan: 16, rowSpan: 1 },
  'text': { colSpan: 20, rowSpan: 3 },
  'roller-coaster': { colSpan: 20, rowSpan: 12 },
};

export function getDefaultSpan(type: BlockType): Span {
  return DEFAULT_SPANS[type];
}

// これ未満だとシミュレーション/数値パネルのレイアウトが崩れるため、リサイズの下限にする。
// horizontal(横並び)はシミュレーションと数値データが横に並ぶ分、vertical(縦並び)より広い幅が必要で、
// vertical は数値データが下に積まれる分、高さが必要になる
const ROLLER_COASTER_MIN_SPANS: Record<RollerCoasterLayout, Span> = {
  horizontal: { colSpan: 13, rowSpan: 8 },
  vertical: { colSpan: 8, rowSpan: 10 },
};

const MIN_SPAN: Span = { colSpan: 1, rowSpan: 1 };

export function getMinSpan(block: BlockData): Span {
  if (block.type === 'roller-coaster') {
    return ROLLER_COASTER_MIN_SPANS[block.parameters.layout ?? 'horizontal'];
  }
  return MIN_SPAN;
}
