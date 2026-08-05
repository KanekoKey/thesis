'use client';

import { useDraggable } from '@dnd-kit/core';
import { Rnd } from 'react-rnd';
import { useEditorStore } from '@/stores/useEditorStore';
import type { BlockType } from '@/types/block';
import { BLOCK_DEFAULTS } from '@/components/blocks/defaults';
import { STATIC_ITEMS, DYNAMIC_ITEMS, type BlockItem } from '@/components/blocks/blockItems';
import type { PaletteDragData } from './EditorBlockDndContext';

// --- BlockSelector | コンポーネント ---
const BUTTON_CLASS = "p-2 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left text-sm text-gray-700 flex items-center gap-2 transition-colors w-full cursor-grab active:cursor-grabbing select-none touch-none";

// クリックでの即時追加と、キャンバスへのドラッグ配置の両方に対応するボタン
function PaletteButton({ item, onClick }: { item: BlockItem; onClick: () => void }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette:${item.type}`,
        data: { source: 'palette', blockType: item.type } satisfies PaletteDragData,
    });

    return (
        <button
            ref={setNodeRef}
            onClick={onClick}
            className={`${BUTTON_CLASS} ${isDragging ? 'opacity-40' : ''}`}
            {...attributes}
            {...listeners}
        >
            {item.icon && <item.icon className="w-4 h-4" />}
            {item.label}
        </button>
    );
}

export default function BlockSelector() {
    const addBlock = useEditorStore((state) => state.addBlock);

    // ブロック追加のハンドラー(クリック時)
    const handleAddBlock = (type: BlockType) => {
        const defaultParams = BLOCK_DEFAULTS[type] || {};
        addBlock(type, defaultParams);
    };

    return (
        <Rnd
            default={{ x: 24, y: 96, width: 256, height: 'auto' }}
            minWidth={200}
            bounds="parent"
            dragHandleClassName="palette-drag-handle"
            enableResizing={{ right: true, bottom: true, bottomRight: true }}
            className="z-20"
        >
            <div className="w-full h-full bg-white/80 backdrop-blur-md shadow-xl rounded-xl border border-gray-200 overflow-hidden flex flex-col">
                {/* タイトルバー */}
                <div className="palette-drag-handle bg-gray-800 text-white px-3 py-2 text-xs font-bold flex justify-between items-center cursor-move select-none">
                    <span>ブロック選択</span>
                    <span className="text-gray-400">≡</span>
                </div>

                {/* ブロック選択の中身 */}
                <div className="p-3 flex flex-col gap-2 overflow-y-auto">
                    <div className="text-xs font-bold text-gray-400 mb-1">静的ブロック</div>
                    {STATIC_ITEMS.map((item) => (
                        <PaletteButton key={item.type} item={item} onClick={() => handleAddBlock(item.type)} />
                    ))}

                    <div className="text-xs font-bold text-gray-400 mt-2 mb-1">動的ブロック</div>
                    {DYNAMIC_ITEMS.map((item) => (
                        <PaletteButton key={item.type} item={item} onClick={() => handleAddBlock(item.type)} />
                    ))}
                </div>
            </div>
        </Rnd>
    );
}
