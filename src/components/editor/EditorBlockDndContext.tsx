'use client';

import { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';

import { useEditorStore } from '@/stores/useEditorStore';
import { BLOCK_DEFAULTS } from '@/components/blocks/defaults';
import { STATIC_ITEMS, DYNAMIC_ITEMS } from '@/components/blocks/blockItems';
import { getDefaultSpan } from '@/lib/blockSpans';
import { CELL_SIZE, SLIDE_WIDTH, centerOnCell, resolvePlacement } from '@/lib/slideGrid';
import type { BlockLayout, BlockType } from '@/types/block';

// BlockSelectorのボタンをドラッグ開始したときに active.data に載せる情報
export type PaletteDragData = { source: 'palette'; blockType: BlockType };

function isPaletteDragData(data: unknown): data is PaletteDragData {
    return !!data && typeof data === 'object' && (data as PaletteDragData).source === 'palette';
}

const PALETTE_ITEMS_BY_TYPE = Object.fromEntries(
    [...STATIC_ITEMS, ...DYNAMIC_ITEMS].map((item) => [item.type, item])
);

// ドロップ先の候補を示すガイド。画面(client)座標の矩形で、置ける場合は青、スライドに空きが無ければ赤
type DropGhost = { top: number; left: number; width: number; height: number; ok: boolean };

type Drop = { placed: BlockLayout | null; ghost: DropGhost };

// ドラッグ中のポインタ位置(画面座標)。キーボード操作時はポインタが無いので、ドラッグ中の要素の中心で代用する
function getPointer(event: DragMoveEvent | DragEndEvent): { x: number; y: number } | null {
    const activator = event.activatorEvent;
    if (activator && 'clientX' in activator) {
        const pointerEvent = activator as PointerEvent;
        return { x: pointerEvent.clientX + event.delta.x, y: pointerEvent.clientY + event.delta.y };
    }
    const rect = event.active.rect.current.translated;
    return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
}

// ポインタがスライド上にあれば、ブロックを置く位置(ポインタを中心にセルへスナップ。重なるなら最寄りの空き)を求める。
// 表示するガイドと実際に置かれる位置が必ず一致するよう、ガイドとドロップで同じ関数を使う
function resolveDrop(type: BlockType, pointer: { x: number; y: number } | null): Drop | null {
    const canvas = document.querySelector<HTMLElement>('[data-slide-canvas]');
    if (!canvas || !pointer) return null;

    const rect = canvas.getBoundingClientRect();
    const inside = pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom;
    if (!inside) return null;

    // 画面の座標を、スライドの論理座標(1280×720基準)に戻す
    const scale = rect.width / SLIDE_WIDTH;
    const desired = centerOnCell(
        { x: (pointer.x - rect.left) / scale, y: (pointer.y - rect.top) / scale },
        getDefaultSpan(type)
    );

    const state = useEditorStore.getState();
    const others = state.slides.find((s) => s.id === state.activeSlideId)?.blocks.map((b) => b.layout) ?? [];
    const placed = resolvePlacement(desired, others);
    const shown = placed ?? desired;
    const cell = CELL_SIZE * scale;

    return {
        placed,
        ghost: {
            top: rect.top + shown.row * cell,
            left: rect.left + shown.col * cell,
            width: shown.colSpan * cell,
            height: shown.rowSpan * cell,
            ok: placed !== null,
        },
    };
}

export default function EditorBlockDndContext({ children }: { children: React.ReactNode }) {
    const addBlock = useEditorStore((state) => state.addBlock);

    const [draggingType, setDraggingType] = useState<BlockType | null>(null);
    const [ghost, setGhost] = useState<DropGhost | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor),
    );

    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current;
        if (isPaletteDragData(data)) setDraggingType(data.blockType);
    };

    // ドラッグ中は実データを一切動かさず、置かれる位置のガイドだけを更新する
    const handleDragMove = (event: DragMoveEvent) => {
        const data = event.active.data.current;
        if (!isPaletteDragData(data)) return;
        setGhost(resolveDrop(data.blockType, getPointer(event))?.ghost ?? null);
    };

    // 実際の追加は、ドロップされた瞬間に一度だけ行う
    const handleDragEnd = (event: DragEndEvent) => {
        const data = event.active.data.current;
        if (isPaletteDragData(data)) {
            const drop = resolveDrop(data.blockType, getPointer(event));
            if (drop?.placed) {
                addBlock(data.blockType, BLOCK_DEFAULTS[data.blockType], { col: drop.placed.col, row: drop.placed.row });
            }
            // スライド外へのドロップ・空きが無い場合は何もしない
        }
        setDraggingType(null);
        setGhost(null);
    };

    const handleDragCancel = () => {
        setDraggingType(null);
        setGhost(null);
    };

    const paletteItem = draggingType ? PALETTE_ITEMS_BY_TYPE[draggingType] : undefined;

    return (
        <DndContext
            id="editor-block-dnd-context"
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            {children}

            {ghost && (
                <div
                    style={{ position: 'fixed', top: ghost.top, left: ghost.left, width: ghost.width, height: ghost.height }}
                    className={`pointer-events-none z-[60] rounded-lg border-2 ${
                        ghost.ok ? 'border-blue-400 bg-blue-50/40' : 'border-red-400 bg-red-50/40'
                    }`}
                />
            )}

            <DragOverlay dropAnimation={null}>
                {paletteItem ? (
                    <div className="pointer-events-none flex items-center gap-2 rounded-lg border-2 border-blue-400 bg-white px-3 py-2 text-sm text-gray-700 shadow-xl">
                        {paletteItem.icon && <paletteItem.icon className="w-4 h-4" />}
                        {paletteItem.label}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
