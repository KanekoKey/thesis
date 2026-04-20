export type BlockType = 'h1' | 'h2' | 'text'

export type Block = {
  id: string;
  type: BlockType;
  content: string;
};