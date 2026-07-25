'use client';

import { useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { useEditorStore } from '@/stores/useEditorStore';
import SortableBlockItem from './SortableBlockItem';
import { getColumnMinWidth } from './blockMinWidth';
import type { BlockData } from '@/types/block';

export const MIN_RATIO = 0.15;
export const MAX_RATIO = 0.85;

interface ColumnProps {
    containerId: string;
    blocks: BlockData[];
}

function Column({ containerId, blocks }: ColumnProps) {
    const { setNodeRef } = useDroppable({
        id: containerId,
        data: { type: 'container', containerId },
    });

    return (
        <div ref={setNodeRef} className="min-w-0 min-h-[48px] h-full flex flex-col gap-2 py-2">
            <SortableContext id={containerId} items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2 flex-1">
                    {blocks.map((block) => (
                        <SortableBlockItem key={block.id} block={block} />
                    ))}
                    {blocks.length === 0 && (
                        <div className="flex-1 min-h-[32px] rounded border border-dashed border-gray-200" />
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

interface Props {
    id: string;
    columns: [BlockData[], BlockData[]];
    ratio: number;
}

export default function TwoColumnBlock({ id, columns, ratio }: Props) {
    const updateBlockParams = useEditorStore((state) => state.updateBlockParams);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    const clampRatio = (value: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, value));

    const handlePointerMove = (e: PointerEvent) => {
        if (!isDraggingRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const newRatio = clampRatio((e.clientX - rect.left) / rect.width);
        updateBlockParams(id, { ratio: newRatio });
    };

    const handlePointerUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        isDraggingRef.current = true;
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    return (
        <div ref={containerRef} className="flex overflow-x-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div style={{ flexGrow: ratio, flexBasis: 0, minWidth: getColumnMinWidth(columns[0]) }}>
                <Column containerId={`${id}:0`} blocks={columns[0]} />
            </div>

            <div
                onPointerDown={handlePointerDown}
                className="w-3 shrink-0 flex items-center justify-center cursor-col-resize group"
            >
                <div className="w-px h-full bg-gray-200 group-hover:bg-blue-400 transition-colors" />
            </div>

            <div style={{ flexGrow: 1 - ratio, flexBasis: 0, minWidth: getColumnMinWidth(columns[1]) }}>
                <Column containerId={`${id}:1`} blocks={columns[1]} />
            </div>
        </div>
    );
}
