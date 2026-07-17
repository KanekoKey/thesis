import type { BlockData, BlockType } from '@/types/block';
import { defaultRollerCoasterParams, ROLLER_COASTER_MIN_WIDTH } from './RollerCoasterBlock';

// two-columnの列間リサイザーの幅(w-3 = 12px)
const TWO_COLUMN_RESIZER_WIDTH = 12;

// 幅に依存しない固定の最小幅(px)を持つブロック種別。ここに無い種別は最小幅なし(0)とする
// (two-column/roller-coasterはパラメータに応じて動的に決まるためここには含めず、下のgetBlockMinWidthで個別に扱う)
const BLOCK_MIN_WIDTHS: Partial<Record<BlockType, number>> = {};

// 列(ブロック配列)が実際に必要とする最小幅を、中身のブロックから再帰的に求める
export function getColumnMinWidth(blocks: BlockData[]): number {
    if (blocks.length === 0) return 0;
    return Math.max(...blocks.map(getBlockMinWidth));
}

function getBlockMinWidth(block: BlockData): number {
    if (block.type === 'two-column') {
        const [left, right] = block.parameters.columns;
        return getColumnMinWidth(left) + getColumnMinWidth(right) + TWO_COLUMN_RESIZER_WIDTH;
    }
    if (block.type === 'roller-coaster') {
        return ROLLER_COASTER_MIN_WIDTH[block.parameters.layout ?? defaultRollerCoasterParams.layout];
    }
    return BLOCK_MIN_WIDTHS[block.type] ?? 0;
}
