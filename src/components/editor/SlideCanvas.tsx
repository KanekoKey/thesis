'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';

import { useEditorStore } from '@/stores/useEditorStore';
import Block from '@/components/blocks/Block';
import type { BlockData } from '@/types/block';

// --- アイテムコンポーネント ---
function SortableBlockItem({ block }: { block: BlockData }) {
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
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative p-4 rounded-lg border-2 transition-colors cursor-pointer bg-white ${
                isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-transparent hover:border-gray-200'
            }`}
            onClick={() => setSelectedBlockId(block.id)}
        >
            {isSelected && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute -top-3 -left-3 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-sm cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                >
                    <span className="text-xs">✥</span>
                </div>
            )}
            <Block block={block} />
        </div>
    );
}

// --- メインのキャンバス ---
export default function SlideCanvas() {
    const slides = useEditorStore((state) => state.slides);
    const activeSlideId = useEditorStore((state) => state.activeSlideId);
    const moveBlock = useEditorStore((state) => state.moveBlock);
    const currentSlide = slides.find(s => s.id === activeSlideId);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            moveBlock(active.id as string, over.id as string);
        }
    };

    return (
        <div className="w-[85vw] max-w-[1024px] aspect-video bg-white shadow-sm border border-gray-300 relative mt-8 flex flex-col z-0">
            <DndContext 
                id="block-dnd-context"
                sensors={sensors} 
                collisionDetection={closestCenter} 
                modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
                onDragEnd={handleDragEnd}
            >
                <div className="p-8 flex-1 overflow-y-auto">
                    <SortableContext 
                        items={currentSlide?.blocks.map(b => b.id) || []} 
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col gap-2">
                            {currentSlide?.blocks.map((block) => (
                                <SortableBlockItem key={block.id} block={block} />
                            ))}

                            {currentSlide?.blocks.length === 0 && (
                                <div className="py-12 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400">
                                    パレットから要素を追加してください
                                </div>
                            )}
                        </div>
                    </SortableContext>
                </div>
            </DndContext>
        </div>
    );
}