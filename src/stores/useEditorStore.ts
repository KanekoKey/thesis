import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { BlockType, BlockData } from '@/types/block';
import type { SlideData } from '@/types/slide';

interface EditorState {
  // --- 状態 (State) ---
  slides: SlideData[];
  activeSlideId: string | null;
  selectedBlockId: string | null;

  // --- 操作 (Actions) ---
  addBlock: <T extends BlockType>(
    type: T, 
    initialParams: Extract<BlockData, { type: T }>['parameters']
  ) => void;
  
  setSelectedBlockId: (id: string | null) => void;
  
  updateBlockParams: (id: string, newParams: Partial<BlockData['parameters']>) => void;
}

// --- Zustand ストアの作成 ---
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

    // ブロックの追加
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

    // 選択中ブロックの切り替え
    setSelectedBlockId: (id) => set((state) => {
      state.selectedBlockId = id;
    }),

    // パラメータの部分更新
    updateBlockParams: (id, newParams) => set((state) => {
      const currentSlide = state.slides.find(s => s.id === state.activeSlideId);
      if (!currentSlide) return;

      const targetBlock = currentSlide.blocks.find(b => b.id === id);
      if (targetBlock) {
        targetBlock.parameters = { ...targetBlock.parameters, ...newParams };
      }
    }),
  }))
);