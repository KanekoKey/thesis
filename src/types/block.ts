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
    mass?: number;                      // 質量 [kg]
    gravity?: number;                   // 重力加速度 [m/s²]
    initialHeight?: number;             // スタートの高さ [m]
    initialVelocity?: number;           // スタートの速度 [m/s]
    trackShape?: 'drop' | 'camel-back' | 'loop';
    // コース形状(drop: 下り坂, camel-back: 大小二つの山, loop: ループ)
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