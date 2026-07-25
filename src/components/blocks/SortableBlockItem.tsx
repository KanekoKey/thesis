'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useEditorStore } from '@/stores/useEditorStore';
import Block from '@/components/blocks/Block';
import type { BlockData } from '@/types/block';

export default function SortableBlockItem({ block }: { block: BlockData }) {
    const selectedBlockId = useEditorStore((state) => state.selectedBlockId);
    const setSelectedBlockId = useEditorStore((state) => state.setSelectedBlockId);
    const isSelected = selectedBlockId === block.id;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            data-block-id={block.id}
            style={style}
            className={`relative p-4 rounded-lg border-2 transition-colors cursor-pointer bg-white ${
                isDragging
                    ? 'border-dashed border-blue-300 bg-blue-50/40'
                    : isSelected
                        ? 'border-blue-500 bg-blue-50/30'
                        : 'border-transparent hover:border-gray-200'
            }`}
            onClick={(e) => {
                e.stopPropagation();
                setSelectedBlockId(block.id);
            }}
        >
            {isSelected && !isDragging && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute -top-3 -left-3 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-sm cursor-grab active:cursor-grabbing hover:scale-110 transition-transform select-none touch-none"
                >
                    <span className="text-xs">✥</span>
                </div>
            )}
            {/* ドラッグ中は実体を非表示にし、見た目はDragOverlay側の固定サイズのプレビューに任せる
                (この場所のサイズだけはレイアウトの隙間として保持する) */}
            <div className={isDragging ? 'invisible' : ''}>
                <Block block={block} />
            </div>
        </div>
    );
}
