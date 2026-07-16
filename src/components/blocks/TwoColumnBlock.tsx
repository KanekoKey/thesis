'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';

import { useEditorStore } from '@/stores/useEditorStore';
import SortableBlockItem from './SortableBlockItem';
import { BLOCK_DEFAULTS } from './defaults';
import { STATIC_ITEMS, DYNAMIC_ITEMS } from './blockItems';
import type { BlockData, BlockType } from '@/types/block';

// 2列ブロックの中に、さらに2列ブロックを入れ子にすると操作が複雑になるため候補から除外
const ADDABLE_ITEMS = [...STATIC_ITEMS, ...DYNAMIC_ITEMS].filter((item) => item.type !== 'two-column');

interface ColumnProps {
    containerId: string;
    columnIndex: number;
    blocks: BlockData[];
}

function Column({ containerId, columnIndex, blocks }: ColumnProps) {
    const moveBlock = useEditorStore((state) => state.moveBlock);
    const addBlockToColumn = useEditorStore((state) => state.addBlockToColumn);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    const handleAddBlock = (type: BlockType) => {
        addBlockToColumn(containerId, columnIndex, type, BLOCK_DEFAULTS[type] || {});
        setIsMenuOpen(false);
    };

    return (
        <div className="flex-1 min-w-0 flex flex-col gap-2 p-2 border border-dashed border-gray-200 rounded-lg">
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
                        {blocks.length === 0 && (
                            <div className="py-6 text-center text-xs text-gray-400">ブロックを追加</div>
                        )}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen((v) => !v);
                    }}
                    className="w-full flex items-center justify-center gap-1 p-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" /> ブロック追加
                </button>
                {isMenuOpen && (
                    <div className="absolute z-30 top-full left-0 mt-1 w-48 bg-white shadow-lg border border-gray-200 rounded-lg p-2 flex flex-col gap-1">
                        {ADDABLE_ITEMS.map((item) => (
                            <button
                                key={item.type}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddBlock(item.type);
                                }}
                                className="flex items-center gap-2 p-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md text-left"
                            >
                                {item.icon && <item.icon className="w-4 h-4" />}
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface Props {
    id: string;
    columns: [BlockData[], BlockData[]];
}

export default function TwoColumnBlock({ id, columns }: Props) {
    return (
        <div className="flex gap-4" onClick={(e) => e.stopPropagation()}>
            {columns.map((blocks, columnIndex) => (
                <Column key={columnIndex} containerId={id} columnIndex={columnIndex} blocks={blocks} />
            ))}
        </div>
    );
}
