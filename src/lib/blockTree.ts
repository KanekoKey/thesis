import type { BlockData } from '@/types/block';

// トップレベルのブロック一覧を表す仮想的なコンテナID。2列ブロックの列は `${twoColumnBlockId}:${columnIndex}` で表す
export const ROOT_CONTAINER_ID = 'root';

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

// コンテナID(トップレベルなら ROOT_CONTAINER_ID、列なら `${twoColumnBlockId}:${columnIndex}`)から
// 実際のブロック配列を取得する
export function findContainerList(blocks: BlockData[], containerId: string): BlockData[] | undefined {
  if (containerId === ROOT_CONTAINER_ID) return blocks;

  const separatorIndex = containerId.lastIndexOf(':');
  if (separatorIndex === -1) return undefined;

  const blockId = containerId.slice(0, separatorIndex);
  const columnIndex = Number(containerId.slice(separatorIndex + 1));

  const block = findBlockById(blocks, blockId);
  if (block && block.type === 'two-column') {
    return block.parameters.columns[columnIndex];
  }
  return undefined;
}

// 指定したブロックが現在属しているコンテナID(トップレベル or 列)を返す
export function findContainerIdForBlock(
  blocks: BlockData[],
  blockId: string,
  containerId: string = ROOT_CONTAINER_ID
): string | undefined {
  if (blocks.some((b) => b.id === blockId)) return containerId;

  for (const block of blocks) {
    if (block.type === 'two-column') {
      for (let i = 0; i < block.parameters.columns.length; i++) {
        const found = findContainerIdForBlock(block.parameters.columns[i], blockId, `${block.id}:${i}`);
        if (found) return found;
      }
    }
  }
  return undefined;
}

// 指定したコンテナIDが、ブロック自身またはその子孫(ネストした2列ブロックの列)の中にあるかどうかを判定する。
// 2列ブロックを自分自身/自分の子孫の列にドロップして循環参照になるのを防ぐために使う
export function isContainerInsideBlock(block: BlockData, containerId: string): boolean {
  if (block.type !== 'two-column') return false;

  for (let i = 0; i < block.parameters.columns.length; i++) {
    if (`${block.id}:${i}` === containerId) return true;
    if (block.parameters.columns[i].some((child) => isContainerInsideBlock(child, containerId))) return true;
  }
  return false;
}
