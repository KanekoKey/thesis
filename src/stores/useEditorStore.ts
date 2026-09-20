import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { BlockType, BlockData, BlockLayout } from '@/types/block';
import type { SlideData } from '@/types/slide';
import { getDefaultSpan } from '@/lib/blockSpans';
import { isPlacementFree, resolvePlacement, type Cell } from '@/lib/slideGrid';

interface EditorState {
  // 状態 (State)
  slides: SlideData[];
  activeSlideId: string | null;
  selectedBlockId: string | null;

  // 操作 (Actions)
  // 新規ブロックを生成してアクティブなスライドのグリッドに配置し、生成したブロックのIDを返す。
  // desired(左上セル)を指定するとそこに置き、他のブロックと重なる場合は最も近い空きに置く。
  // 省略時は左上から見て最も近い空きに置く。スライドに空きが無ければ何もせず null を返す
  addBlock: <T extends BlockType>(
    type: T,
    initialParams: Extract<BlockData, { type: T }>['parameters'],
    desired?: Cell
  ) => string | null;
  setSelectedBlockId: (id: string | null) => void;
  // DBから読み込んだデッキの内容でストア全体を置き換える(エディタ初期表示用)
  setSlides: (slides: SlideData[]) => void;
  updateBlockParams: (id: string, newParams: Partial<BlockData['parameters']>) => void;
  removeBlock: (id: string) => void;
  // ブロックの位置・大きさを変更する。スライドからはみ出す/他のブロックと重なる指定は無視する
  setBlockLayout: (id: string, layout: BlockLayout) => void;
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
    addBlock: (type, initialParams, desired = { col: 0, row: 0 }) => {
      let newBlockId: string | null = null;

      set((state) => {
        const currentSlide = state.slides.find(s => s.id === state.activeSlideId);
        if (!currentSlide) return;

        const layout = resolvePlacement(
          { ...desired, ...getDefaultSpan(type) },
          currentSlide.blocks.map(b => b.layout)
        );
        if (!layout) return;

        // (呼び出し元のジェネリックTをそのまま受け取ると型推論が破綻するため、BlockDataへ明示的にキャストする)
        const newBlock = { id: crypto.randomUUID(), type, layout, parameters: initialParams } as BlockData;
        currentSlide.blocks.push(newBlock);
        state.selectedBlockId = newBlock.id;
        newBlockId = newBlock.id;
      });

      return newBlockId;
    },

    // --- 選択中ブロックの切り替え ---
    setSelectedBlockId: (id) => set((state) => {
      state.selectedBlockId = id;
    }),

    // --- デッキ読み込み(既存の編集内容を丸ごと置き換える) ---
    setSlides: (slides) => set((state) => {
      state.slides = slides.length > 0 ? slides : [{ id: 's1', blocks: [] }];
      state.activeSlideId = state.slides[0].id;
      state.selectedBlockId = null;
    }),

    // --- パラメータの部分更新 ---
    updateBlockParams: (id, newParams) => set((state) => {
      const currentSlide = state.slides.find(s => s.id === state.activeSlideId);
      if (!currentSlide) return;

      const targetBlock = currentSlide.blocks.find(b => b.id === id);
      if (targetBlock) {
        targetBlock.parameters = { ...targetBlock.parameters, ...newParams };
      }
    }),

    // --- ブロックの削除 ---
    removeBlock: (id) => set((state) => {
      const currentSlide = state.slides.find(s => s.id === state.activeSlideId);
      if (!currentSlide) return;

      const targetIndex = currentSlide.blocks.findIndex(b => b.id === id);
      if (targetIndex === -1) return;

      if (state.selectedBlockId === id) {
        state.selectedBlockId = null;
      }

      currentSlide.blocks.splice(targetIndex, 1);
    }),

    // --- ブロックの位置・大きさの変更 ---
    setBlockLayout: (id, layout) => set((state) => {
      const currentSlide = state.slides.find(s => s.id === state.activeSlideId);
      if (!currentSlide) return;

      const targetBlock = currentSlide.blocks.find(b => b.id === id);
      if (!targetBlock) return;

      const others = currentSlide.blocks.filter(b => b.id !== id).map(b => b.layout);
      if (!isPlacementFree(layout, others)) return;

      targetBlock.layout = layout;
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
