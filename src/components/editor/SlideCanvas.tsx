'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { useEditorStore } from '@/stores/useEditorStore';
import SortableBlockItem from '@/components/blocks/SortableBlockItem';
import { ROOT_CONTAINER_ID } from '@/lib/blockTree';

// --- メインのキャンバス ---
export default function SlideCanvas() {
    const slides = useEditorStore((state) => state.slides);
    const activeSlideId = useEditorStore((state) => state.activeSlideId);
    const currentSlide = slides.find(s => s.id === activeSlideId);

    const { setNodeRef } = useDroppable({
        id: ROOT_CONTAINER_ID,
        data: { type: 'container', containerId: ROOT_CONTAINER_ID },
    });

    return (
        <div
            data-slide-canvas
            className="w-[85vw] max-w-[1024px] aspect-video bg-white shadow-sm border border-gray-300 relative mt-8 flex flex-col z-0"
        >
            <div ref={setNodeRef} className="p-8 flex-1 overflow-y-auto">
                <SortableContext
                    id={ROOT_CONTAINER_ID}
                    items={currentSlide?.blocks.map(b => b.id) || []}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-2 min-h-full">
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
        </div>
    );
}
