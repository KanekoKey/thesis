// src/components/blocks/SortableBlockItem.tsx

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditorStore } from '@/stores/useEditorStore';
import Block from '@/components/blocks/Block';
import type { BlockData } from '@/types/block';

interface Props {
    block: BlockData;
}

export default function SortableBlockItem({ block }: Props) {
    const selectedBlockId = useEditorStore((state) => state.selectedBlockId);
    const setSelectedBlockId = useEditorStore((state) => state.setSelectedBlockId);
    const isSelected = selectedBlockId === block.id;

    // 🌟 dnd-kit のフックを使って、ドラッグに必要な情報を取得
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    // ドラッグ中の見た目（アニメーションや半透明化）を計算
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative p-4 rounded-lg border-2 transition-colors cursor-pointer bg-white ${
                isSelected
                    ? 'border-blue-500 bg-blue-50/30'
                    : 'border-transparent hover:border-gray-200'
            }`}
            onClick={() => setSelectedBlockId(block.id)}
        >
            {/* 🌟 取っ手（✥）にのみ、ドラッグ開始のリスナーを紐付ける */}
            {isSelected && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute -top-3 -left-3 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-sm cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                >
                    <span className="text-xs">✥</span>
                </div>
            )}
            
            {/* 万能コンポーネント（中身） */}
            <Block block={block} />
        </div>
    );
}