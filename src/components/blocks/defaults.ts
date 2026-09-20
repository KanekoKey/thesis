import type { BlockType } from '@/types/block';

import { defaultCounterParams } from './CounterBlock';
import { defaultRollerCoasterParams } from './RollerCoasterBlock';
import { defaultTextParams } from './TextBlock';
import { defaultH1Params } from './H1Block';
import { defaultH2Params } from './H2Block';
import { defaultH3Params } from './H3Block';
import { defaultH4Params } from './H4Block';

export const BLOCK_DEFAULTS = {
  'counter': defaultCounterParams,
  'roller-coaster': defaultRollerCoasterParams,
  'h1': defaultH1Params,
  'h2': defaultH2Params,
  'h3': defaultH3Params,
  'h4': defaultH4Params,
  'text': defaultTextParams,
} satisfies Record<BlockType, unknown>;