import type { BlockType, TwoColumnBlockData } from '@/types/block';

import { defaultCounterParams } from './CounterBlock';
import { defaultRollerCoasterParams } from './RollerCoasterBlock';
import { defaultTextParams } from './TextBlock';

// TwoColumnBlock.tsx はブロック追加時に BLOCK_DEFAULTS を参照するため、
// 循環importを避けるためデフォルト値はここに直接定義する
const defaultTwoColumnParams: TwoColumnBlockData['parameters'] = {
  columns: [[], []],
};

export const BLOCK_DEFAULTS = {
  'counter': defaultCounterParams,
  'roller-coaster': defaultRollerCoasterParams,
  'h1': defaultTextParams,
  'h2': defaultTextParams,
  'h3': defaultTextParams,
  'h4': defaultTextParams,
  'text': defaultTextParams,
  'two-column': defaultTwoColumnParams,
} satisfies Record<BlockType, unknown>;