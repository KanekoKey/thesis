import { ReactNode } from 'react';

export type BlockType = 'h1' | 'h2' | 'h3' | 'h4' | 'text'

export type Block = {
  id: string;
  type: BlockType;
  content: string;
};

export type TextBlockProps = {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'text';
  children: ReactNode;
};

// 全てのブロックの型を合体（ユニオン）
export type BlockProps = TextBlockProps;
