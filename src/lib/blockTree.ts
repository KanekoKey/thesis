import type { BlockData } from '@/types/block';

// ブロック配列（2列ブロックの列内も含む）を再帰的に辿り、指定IDのブロックを探す
export function findBlockById(blocks: BlockData[], id: string): BlockData | undefined {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.type === 'two-column') {
      for (const column of block.parameters.columns) {
        const found = findBlockById(column, id);
        if (found) return found;
      }
    }
  }
  return undefined;
}

// 指定IDのブロックを直接保持している配列（トップレベル or 2列ブロックの列）を探す
export function findParentList(blocks: BlockData[], id: string): BlockData[] | undefined {
  if (blocks.some((b) => b.id === id)) return blocks;
  for (const block of blocks) {
    if (block.type === 'two-column') {
      for (const column of block.parameters.columns) {
        const found = findParentList(column, id);
        if (found) return found;
      }
    }
  }
  return undefined;
}
