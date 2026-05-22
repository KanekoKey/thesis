export type CounterBlockData = {
  id: string;
  type: 'counter';
  parameters: {
    initialCount: number;
    step: number;
    label: string;
  };
}

export type RollerCoasterBlockData = {
  id: string;
  type: 'roller-coaster';
  parameters: {
    mass?: number;
    gravity?: number;
    initialHeight?: number;
    trackShape?: 'drop' | 'camel-back';
    controlMode?: 'manual' | 'time';
  };
};

export type TextBlockData = {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'text';
  parameters: {
    content: string;
  };
};

// 全てのブロックの型を合体（ユニオン）
export type BlockData = TextBlockData | CounterBlockData | RollerCoasterBlockData;

// ブロックの種類だけを抜き取るユーティリティ型
export type BlockType = BlockData['type'];