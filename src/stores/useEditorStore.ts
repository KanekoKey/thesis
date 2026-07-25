import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { BlockType, BlockData } from '@/types/block';
import type { SlideData } from '@/types/slide';
import {
  findBlockById,
  findParentList,
  findContainerList,
  isContainerInsideBlock,
} from '@/lib/blockTree';

// 2列ブロックは、左右の列にそれぞれ空のテキストブロックを入れた状態で生成する
// (デフォルト値をそのまま使うと複数の2列ブロックが列の配列を共有してしまうため、都度生成する)
// (呼び出し元のジェネリックTをそのまま受け取ると型推論が破綻するため、あえて非ジェネリックにしてBlockData['parameters']で受ける)
function buildNewBlock(type: BlockType, initialParams: BlockData['parameters']): BlockData {
  const newBlock = {
    id: crypto.randomUUID(),
    type,
    parameters: initialParams,
  } as BlockData;

  if (newBlock.type === 'two-column') {
    const leftBlock: BlockData = { id: crypto.randomUUID(), type: 'text', parameters: { content: '' } };
    const rightBlock: BlockData = { id: crypto.randomUUID(), type: 'text', parameters: { content: '' } };
    newBlock.parameters = { ratio: 0.5, columns: [[leftBlock], [rightBlock]] };
  }

  return newBlock;
}

interface EditorState {
  // 状態 (State)
  slides: SlideData[];
  activeSlideId: string | null;
  selectedBlockId: string | null;

  // 操作 (Actions)
  // 選択中のブロックの直後(列の中を選択していればその列)に追加する。
  // 何も選択していなければスライド末尾に追加する。
  addBlock: <T extends BlockType>(
    type: T,
    initialParams: Extract<BlockData, { type: T }>['parameters']
  ) => void;
  // 指定したコンテナ(トップレベル or 2列ブロックの列)の指定位置に新規ブロックを生成して挿入し、生成したブロックのIDを返す
  spawnBlockAt: <T extends BlockType>(
    type: T,
    initialParams: Extract<BlockData, { type: T }>['parameters'],
    containerId: string,
    index: number
  ) => string;
  setSelectedBlockId: (id: string | null) => void;
  updateBlockParams: (id: string, newParams: Partial<BlockData['parameters']>) => void;
  removeBlock: (id: string) => void;
  // 指定したブロックを、指定したコンテナ(トップレベル or 2列ブロックの列)の指定位置に移動する。
  // 同じコンテナ内での並び替え・別コンテナ(別の列など)への移動の両方に対応する
  moveBlock: (blockId: string, containerId: string, index: number) => void;
  addSlide: () => void;
  setActiveSlideId: (id: string) => void;
  deleteSlide: (id: string) => void;
  moveSlide: (activeId: string, overId: string) => void;
}

export const useEditorStore = create<EditorState>()(
  immer((set) => ({
    // 初期状態
    slides: [
      {
        id: 's1',
        blocks: [],
      }
    ],
    activeSlideId: 's1',
    selectedBlockId: null,

    // --- ブロックの追加 ---
    addBlock: (type, initialParams) => set((state) => {
      const currentSlide = state.slides.find(s => s.id === state.activeSlideId);
      if (!currentSlide) return;

      const newBlock = buildNewBlock(type, initialParams);
      const selectAfterInsert = newBlock.type === 'two-column' ? newBlock.parameters.columns[0][0].id : newBlock.id;

      // 選択中のブロックがあれば、その直後(同じ階層)に挿入する
      const list = state.selectedBlockId
        ? findParentList(currentSlide.blocks, state.selectedBlockId)
        : undefined;

      if (list) {
        const index = list.findIndex(b => b.id === state.selectedBlockId);
        list.splice(index + 1, 0, newBlock);
      } else {
        currentSlide.blocks.push(newBlock);
      }

      state.selectedBlockId = selectAfterInsert;
    }),

    // --- コンテナ(トップレベル or 2列ブロックの列)の指定位置へブロックを新規生成して挿入 ---
    spawnBlockAt: (type, initialParams, containerId, index) => {
      const newBlock = buildNewBlock(type, initialParams);

      set((state) => {
        const currentSlide = state.slides.find(s => s.id === state.activeSlideId);
        if (!currentSlide) return;

        const list = findContainerList(currentSlide.blocks, containerId) ?? currentSlide.blocks;
        const insertIndex = Math.max(0, Math.min(index, list.length));
        list.splice(insertIndex, 0, newBlock);
        state.selectedBlockId = newBlock.id;
      });

      return newBlock.id;
    },

    // --- 選択中ブロックの切り替え ---
    setSelectedBlockId: (id) => set((state) => {
      state.selectedBlockId = id;
    }),

    // --- パラメータの部分更新 ---
    updateBlockParams: (id, newParams) => set((state) => {
      const currentSlide = state.slides.find(s => s.id === state.activeSlideId);
      if (!currentSlide) return;

      const targetBlock = findBlockById(currentSlide.blocks, id);
      if (targetBlock) {
        targetBlock.parameters = { ...targetBlock.parameters, ...newParams };
      }
    }),

    // --- ブロックの削除 ---
    removeBlock: (id) => set((state) => {
      const currentSlide = state.slides.find(s => s.id === state.activeSlideId);
      if (!currentSlide) return;

      const list = findParentList(currentSlide.blocks, id);
      if (!list) return;

      const targetIndex = list.findIndex(b => b.id === id);
      if (targetIndex === -1) return;

      if (state.selectedBlockId === id) {
        if (targetIndex > 0) {
          state.selectedBlockId = list[targetIndex - 1].id;
        } else if (list.length > 1) {
          state.selectedBlockId = list[targetIndex + 1].id;
        } else {
          state.selectedBlockId = null;
        }
      }

      list.splice(targetIndex, 1);
    }),

    // --- ブロックの移動 ---
    // 同じコンテナ内での並び替えと、別コンテナ(トップレベル ⇔ 2列ブロックの列、列 ⇔ 別の列)への移動を両方扱う。
    // 別コンテナへの移動は source から取り除いてから dest の index に挿入するだけで良く、
    // 同じコンテナ内の移動も「取り除いてから挿入」で arrayMove と同じ結果になる
    moveBlock: (blockId, containerId, index) => set((state) => {
      const currentSlide = state.slides.find(s => s.id === state.activeSlideId);
      if (!currentSlide) return;

      const block = findBlockById(currentSlide.blocks, blockId);
      const sourceList = findParentList(currentSlide.blocks, blockId);
      if (!block || !sourceList) return;

      // 2列ブロックを自分自身や自分の子孫の列に移動するのは循環になるため禁止
      if (isContainerInsideBlock(block, containerId)) return;

      const destList = findContainerList(currentSlide.blocks, containerId);
      if (!destList) return;

      const sourceIndex = sourceList.findIndex(b => b.id === blockId);
      if (sourceIndex === -1) return;

      const isSameList = sourceList === destList;
      if (isSameList && sourceIndex === index) return;

      sourceList.splice(sourceIndex, 1);
      const insertIndex = Math.max(0, Math.min(index, destList.length));
      destList.splice(insertIndex, 0, block);
    }),

    // --- スライドの追加 ---
    addSlide: () => set((state) => {
      const newSlideId = crypto.randomUUID();
      const newSlide = {
        id: newSlideId,
        blocks: [],
      };
      const activeIndex = state.slides.findIndex(s => s.id === state.activeSlideId);

      if (activeIndex !== -1) {
        state.slides.splice(activeIndex + 1, 0, newSlide);
      } else {
        state.slides.push(newSlide);
      }

      state.activeSlideId = newSlideId;
      state.selectedBlockId = null;
    }),

    // --- スライドの切り替え ---
    setActiveSlideId: (id) => set((state) => {
      state.activeSlideId = id;
      state.selectedBlockId = null;
    }),

    // --- スライドの削除 ---
    deleteSlide: (id) => set((state) => {
      if (state.slides.length <= 1) return;

      const targetIndex = state.slides.findIndex(s => s.id === id);
      if (targetIndex === -1) return;

      if (state.activeSlideId === id) {
        const newActiveIndex = targetIndex > 0 ? targetIndex - 1 : 1;
        state.activeSlideId = state.slides[newActiveIndex].id;
      }

      state.slides.splice(targetIndex, 1);
    }),

    // --- スライドの移動 ---
    moveSlide: (activeId, overId) => set((state) => {
      const oldIndex = state.slides.findIndex(s => s.id === activeId);
      const newIndex = state.slides.findIndex(s => s.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const [movedSlide] = state.slides.splice(oldIndex, 1);
        state.slides.splice(newIndex, 0, movedSlide);
      }
    }),
  }))
);