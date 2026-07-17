'use client';

import { useRef } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';

import { useEditorStore } from '@/stores/useEditorStore';
import SortableBlockItem from './SortableBlockItem';
import { getColumnMinWidth } from './blockMinWidth';
import type { BlockData } from '@/types/block';

export const MIN_RATIO = 0.15;
export const MAX_RATIO = 0.85;

interface ColumnProps {
    containerId: string;
    columnIndex: number;
    blocks: BlockData[];
}

function Column({ containerId, columnIndex, blocks }: ColumnProps) {
    const moveBlock = useEditorStore((state) => state.moveBlock);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            moveBlock(active.id as string, over.id as string);
        }
    };

    return (
        <div className="min-w-0 flex flex-col gap-2 py-2">
            <DndContext
                id={`two-column-${containerId}-${columnIndex}`}
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2">
                        {blocks.map((block) => (
                            <SortableBlockItem key={block.id} block={block} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
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
                <Column containerId={id} columnIndex={0} blocks={columns[0]} />
            </div>

            <div
                onPointerDown={handlePointerDown}
                className="w-3 shrink-0 flex items-center justify-center cursor-col-resize group"
            >
                <div className="w-px h-full bg-gray-200 group-hover:bg-blue-400 transition-colors" />
            </div>

            <div style={{ flexGrow: 1 - ratio, flexBasis: 0, minWidth: getColumnMinWidth(columns[1]) }}>
                <Column containerId={id} columnIndex={1} blocks={columns[1]} />
            </div>
        </div>
    );
}
