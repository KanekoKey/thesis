'use client';

import { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    pointerWithin,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { Active, CollisionDetection, DragEndEvent, DragOverEvent, DragStartEvent, Over } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { useEditorStore } from '@/stores/useEditorStore';
import { BLOCK_DEFAULTS } from '@/components/blocks/defaults';
import { STATIC_ITEMS, DYNAMIC_ITEMS } from '@/components/blocks/blockItems';
import Block from '@/components/blocks/Block';
import { findBlockById, findContainerList } from '@/lib/blockTree';
import type { BlockData, BlockType } from '@/types/block';

// BlockSelectorのボタンをドラッグ開始したときに active.data に載せる情報
export type PaletteDragData = { source: 'palette'; blockType: BlockType };

function isPaletteDragData(data: unknown): data is PaletteDragData {
    return !!data && typeof data === 'object' && (data as PaletteDragData).source === 'palette';
}

type SortableItemData = { sortable: { containerId: string; index: number } };

function isSortableItemData(data: unknown): data is SortableItemData {
    return !!data && typeof data === 'object' && 'sortable' in (data as Record<string, unknown>);
}

type ContainerDropData = { type: 'container'; containerId: string };

function isContainerDropData(data: unknown): data is ContainerDropData {
    return !!data && typeof data === 'object' && (data as ContainerDropData).type === 'container';
}

const PALETTE_ITEMS_BY_TYPE = Object.fromEntries(
    [...STATIC_ITEMS, ...DYNAMIC_ITEMS].map((item) => [item.type, item])
);

// 挿入位置を示すインジケーターの見た目情報。実データは動かさず、これだけを描画する
type Indicator =
    | { kind: 'line'; top: number; left: number; width: number }
    | { kind: 'empty'; top: number; left: number; width: number; height: number };

// over(ドロップ先候補)への挿入位置(コンテナID+index)と、それを示すインジケーターを同時に求める。
// sortableアイテムにホバーしている場合は、ドラッグ中の要素がその上半分/下半分どちらにあるかで
// 「前に挿入」か「後ろに挿入」かを判定する
function resolveDrag(
    active: Active,
    over: Over | null,
    blocks: BlockData[]
): { containerId: string; index: number; indicator: Indicator } | null {
    if (!over || !over.rect) return null;
    const data = over.data.current;

    if (isContainerDropData(data)) {
        const list = findContainerList(blocks, data.containerId) ?? [];
        const r = over.rect;

        if (list.length === 0) {
            return {
                containerId: data.containerId,
                index: 0,
                indicator: { kind: 'empty', top: r.top, left: r.left, width: r.width, height: r.height },
            };
        }

        // 中身があるコンテナの余白(パディング等、どのブロックの矩形にも含まれない隙間)にホバーした場合。
        // コンテナ全体をハイライトすると中身を全部置き換えるように見えて誤解を招くため、
        // 末尾のブロックの直後に挿入される線インジケーターを表示する
        const lastBlockId = list[list.length - 1].id;
        const lastNode = document.querySelector<HTMLElement>(`[data-slide-canvas] [data-block-id="${lastBlockId}"]`);
        const lastRect = lastNode?.getBoundingClientRect();

        return {
            containerId: data.containerId,
            index: list.length,
            indicator: lastRect
                ? { kind: 'line', top: lastRect.bottom, left: lastRect.left, width: lastRect.width }
                : { kind: 'empty', top: r.top, left: r.left, width: r.width, height: r.height },
        };
    }

    if (isSortableItemData(data)) {
        const overRect = over.rect;
        const activeRect = active.rect.current.translated;
        const isAfter = !!(
            activeRect &&
            activeRect.top + activeRect.height / 2 > overRect.top + overRect.height / 2
        );
        return {
            containerId: data.sortable.containerId,
            index: data.sortable.index + (isAfter ? 1 : 0),
            indicator: {
                kind: 'line',
                top: isAfter ? overRect.top + overRect.height : overRect.top,
                left: overRect.left,
                width: overRect.width,
            },
        };
    }

    return null;
}

// closestCenterはドラッグ中の要素自身の矩形の中心同士を比較するため、
// ルート直下のフル幅ブロックのように「元の矩形が持ち先(列など)よりずっと大きい」場合、
// 矩形の中心が実際のポインタ位置から大きくズレて誤ったコンテナに判定されてしまう。
// そのため、まず実際のポインタ位置で当たっているコンテナを優先し(pointerWithin)、
// どこにも当たっていない場合(キーボード操作時など)だけclosestCenterにフォールバックする
const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
        return pointerCollisions;
    }
    return closestCenter(args);
};

function getCurrentBlocks(): BlockData[] {
    const state = useEditorStore.getState();
    return state.slides.find((s) => s.id === state.activeSlideId)?.blocks ?? [];
}

// ドラッグ中に浮かせて表示するプレビュー(DragOverlayの中身)
type DragPreview =
    | { kind: 'block'; blockId: string; width: number; height: number }
    | { kind: 'palette'; blockType: BlockType };

export default function EditorBlockDndContext({ children }: { children: React.ReactNode }) {
    const slides = useEditorStore((state) => state.slides);
    const activeSlideId = useEditorStore((state) => state.activeSlideId);
    const moveBlock = useEditorStore((state) => state.moveBlock);
    const spawnBlockAt = useEditorStore((state) => state.spawnBlockAt);
    const setSelectedBlockId = useEditorStore((state) => state.setSelectedBlockId);

    const blocks = slides.find((s) => s.id === activeSlideId)?.blocks ?? [];

    const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
    const [indicator, setIndicator] = useState<Indicator | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const data = active.data.current;

        if (isPaletteDragData(data)) {
            setDragPreview({ kind: 'palette', blockType: data.blockType });
            return;
        }

        const blockId = active.id as string;
        // dnd-kitのactive.rect.current.initialはこの時点ではまだ計測されていないことがあるため、
        // 実DOMのサイズを直接測ってドラッグ中に表示するプレビューのサイズを固定する。
        // SlideNavigatorのミニプレビューも(2列ブロックの中身に限り)同じSortableBlockItemを再利用しており
        // 同じdata-block-idを持つ縮小コピーが存在するため、実キャンバス内に限定して探す
        const node = document.querySelector<HTMLElement>(`[data-slide-canvas] [data-block-id="${blockId}"]`);
        const rect = node?.getBoundingClientRect();
        setDragPreview({ kind: 'block', blockId, width: rect?.width ?? 0, height: rect?.height ?? 0 });
    };

    // ドラッグ中は実データを一切動かさず、挿入位置のインジケーターだけを更新する
    const handleDragOver = (event: DragOverEvent) => {
        const resolved = resolveDrag(event.active, event.over, getCurrentBlocks());
        setIndicator(resolved?.indicator ?? null);
    };

    // 実データの移動/新規挿入は、ドロップされた瞬間に一度だけ行う
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const data = active.data.current;
        const resolved = resolveDrag(active, over, getCurrentBlocks());

        if (resolved) {
            if (isPaletteDragData(data)) {
                const defaultParams = BLOCK_DEFAULTS[data.blockType] ?? {};
                const newBlockId = spawnBlockAt(data.blockType, defaultParams, resolved.containerId, resolved.index);
                setSelectedBlockId(newBlockId);
            } else {
                moveBlock(active.id as string, resolved.containerId, resolved.index);
            }
        }
        // 有効なドロップ先が無い場合は何もしない。実データはまだ動いていないので後始末は不要

        setDragPreview(null);
        setIndicator(null);
    };

    const handleDragCancel = () => {
        setDragPreview(null);
        setIndicator(null);
    };

    const draggedBlock = dragPreview?.kind === 'block' ? findBlockById(blocks, dragPreview.blockId) : undefined;
    const paletteItem = dragPreview?.kind === 'palette' ? PALETTE_ITEMS_BY_TYPE[dragPreview.blockType] : undefined;

    return (
        <DndContext
            id="editor-block-dnd-context"
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            {children}

            {indicator?.kind === 'line' && (
                <div
                    style={{ position: 'fixed', top: indicator.top - 1, left: indicator.left, width: indicator.width }}
                    className="h-[3px] bg-blue-500 rounded-full pointer-events-none z-[60]"
                />
            )}
            {indicator?.kind === 'empty' && (
                <div
                    style={{
                        position: 'fixed',
                        top: indicator.top,
                        left: indicator.left,
                        width: indicator.width,
                        height: indicator.height,
                    }}
                    className="border-2 border-blue-400 bg-blue-50/40 rounded-lg pointer-events-none z-[60]"
                />
            )}

            <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                {dragPreview?.kind === 'block' && draggedBlock ? (
                    <div
                        style={{ width: dragPreview.width, height: dragPreview.height }}
                        className="pointer-events-none overflow-hidden rounded-lg border-2 border-blue-400 bg-white p-4 shadow-xl"
                    >
                        <Block block={draggedBlock} />
                    </div>
                ) : null}
                {dragPreview?.kind === 'palette' && paletteItem ? (
                    <div className="pointer-events-none flex items-center gap-2 rounded-lg border-2 border-blue-400 bg-white px-3 py-2 text-sm text-gray-700 shadow-xl">
                        {paletteItem.icon && <paletteItem.icon className="w-4 h-4" />}
                        {paletteItem.label}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
