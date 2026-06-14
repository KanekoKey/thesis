import type { BlockType } from '@/types/block';

import { defaultCounterParams } from './CounterBlock';
import { defaultRollerCoasterParams } from './RollerCoasterBlock';
import { defaultTextParams } from './TextBlock';

export const BLOCK_DEFAULTS = {
  'counter': defaultCounterParams,
  'roller-coaster': defaultRollerCoasterParams,
  'h1': defaultTextParams,
  'h2': defaultTextParams,
  'h3': defaultTextParams,
  'h4': defaultTextParams,
  'text': defaultTextParams,
} satisfies Record<BlockType, unknown>;