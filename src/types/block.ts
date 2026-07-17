// --- テキスト系ブロック ---
export type TextParameters = {
  content: string;
};
export type TextBlockData = { id: string; type: 'text'; parameters: TextParameters; };
export type H1BlockData = { id: string; type: 'h1'; parameters: TextParameters; };
export type H2BlockData = { id: string; type: 'h2'; parameters: TextParameters; };
export type H3BlockData = { id: string; type: 'h3'; parameters: TextParameters; };
export type H4BlockData = { id: string; type: 'h4'; parameters: TextParameters; };

export type RollerCoasterLayout = 'horizontal' | 'vertical';

export type RollerCoasterBlockData = {
  id: string;
  type: 'roller-coaster';
  parameters: {
    layout?: RollerCoasterLayout;
    // horizontal: シミュレーションと数値データを横並び, vertical: 縦並び
    trackShape?: 'drop' | 'camel-back' | 'loop';
    // コース形状(drop: 下り坂, camel-back: 大小二つの山, loop: ループ)
    mass?: number;                      // 質量 [kg]
    gravity?: number;                   // 重力加速度 [m/s²]
    initialHeight?: number;             // スタートの高さ [m]
    peakHeight?: number;                // ループの高さ [m]
    initialVelocity?: number;           // スタートの速度 [m/s]
  };
};

export type CounterBlockData = {
  id: string;
  type: 'counter';
  parameters: {
    initialCount: number;
    step: number;
    label: string;
  };
}

export type TwoColumnBlockData = {
  id: string;
  type: 'two-column';
  parameters: {
    columns: [BlockData[], BlockData[]];
    ratio: number; // 左列の幅の割合 (0〜1)。右列は 1 - ratio
  };
};

// 全てのブロックの型を合体（ユニオン）
export type BlockData =
  | TextBlockData
  | H1BlockData
  | H2BlockData
  | H3BlockData
  | H4BlockData
  | RollerCoasterBlockData
  | CounterBlockData
  | TwoColumnBlockData;

// ブロックの種類だけを抜き取るユーティリティ型
export type BlockType = BlockData['type'];