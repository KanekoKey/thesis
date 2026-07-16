import type { BlockType, TwoColumnBlockData } from '@/types/block';

import { defaultCounterParams } from './CounterBlock';
import { defaultRollerCoasterParams } from './RollerCoasterBlock';
import { defaultTextParams } from './TextBlock';
import { defaultH1Params } from './H1Block';
import { defaultH2Params } from './H2Block';
import { defaultH3Params } from './H3Block';
import { defaultH4Params } from './H4Block';

// 実際の初期ブロック(左右の空テキストブロック)は useEditorStore の addBlock 内で
// 都度新しいidを振って生成する(ここで固定のブロックを持たせると複数追加時にidが衝突するため)
const defaultTwoColumnParams: TwoColumnBlockData['parameters'] = {
  columns: [[], []],
  ratio: 0.5,
};

export const BLOCK_DEFAULTS = {
  'counter': defaultCounterParams,
  'roller-coaster': defaultRollerCoasterParams,
  'h1': defaultH1Params,
  'h2': defaultH2Params,
  'h3': defaultH3Params,
  'h4': defaultH4Params,
  'text': defaultTextParams,
  'two-column': defaultTwoColumnParams,
} satisfies Record<BlockType, unknown>;