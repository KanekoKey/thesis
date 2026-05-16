export type TextBlockData = {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'text';
  parameters: {
    content: string;
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

// 全てのブロックの型を合体（ユニオン）
export type BlockData = TextBlockData | CounterBlockData;

// ブロックの種類だけを抜き取るユーティリティ型
export type BlockType = BlockData['type'];