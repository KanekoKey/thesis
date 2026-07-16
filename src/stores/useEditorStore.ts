import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { BlockType, BlockData } from '@/types/block';
import type { SlideData } from '@/types/slide';
import { findBlockById, findParentList } from '@/lib/blockTree';

interface EditorState {
  // 状態 (State)
  slides: SlideData[];
  activeSlideId: string | null;
  selectedBlockId: string | null;

  // 操作 (Actions)
  addBlock: <T extends BlockType>(
    type: T,
    initialParams: Extract<BlockData, { type: T }>['parameters']
  ) => void;
  addBlockToColumn: <T extends BlockType>(
    containerId: string,
    columnIndex: number,
    type: T,
    initialParams: Extract<BlockData, { type: T }>['parameters']
  ) => void;
  setSelectedBlockId: (id: string | null) => void;
  updateBlockParams: (id: string, newParams: Partial<BlockData['parameters']>) => void;
  removeBlock: (id: string) => void;
  moveBlock: (activeId: string, overId: string) => void;
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
      if (currentSlide) {
        currentSlide.blocks.push({
          id: crypto.randomUUID(),
          type,
          parameters: initialParams,
        } as BlockData);
      }
    }),

    // --- 2列ブロックの列へのブロック追加 ---
    addBlockToColumn: (containerId, columnIndex, type, initialParams) => set((state) => {
      const currentSlide = state.slides.find(s => s.id === state.activeSlideId);
      if (!currentSlide) return;

      const container = findBlockById(currentSlide.blocks, containerId);
      if (!container || container.type !== 'two-column') return;

      container.parameters.columns[columnIndex].push({
        id: crypto.randomUUID(),
        type,
        parameters: initialParams,
      } as BlockData);
    }),

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
    moveBlock: (activeId, overId) => set((state) => {
      const currentSlide = state.slides.find(s => s.id === state.activeSlideId);
      if (!currentSlide) return;

      const list = findParentList(currentSlide.blocks, activeId);
      if (!list) return;

      const oldIndex = list.findIndex(b => b.id === activeId);
      const newIndex = list.findIndex(b => b.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const [movedBlock] = list.splice(oldIndex, 1);
        list.splice(newIndex, 0, movedBlock);
      }
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