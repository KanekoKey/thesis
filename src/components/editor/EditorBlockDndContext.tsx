'use client';

import { useRef, useState } from 'react';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent, Over } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { useEditorStore } from '@/stores/useEditorStore';
import { BLOCK_DEFAULTS } from '@/components/blocks/defaults';
import Block from '@/components/blocks/Block';
import {
    ROOT_CONTAINER_ID,
    findBlockById,
    findContainerIdForBlock,
    findContainerList,
} from '@/lib/blockTree';
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

// over(ドロップ先候補)から「どのコンテナの何番目に置こうとしているか」を求める
function resolveOverTarget(over: Over | null, blocks: BlockData[]): { containerId: string; index: number } | null {
    if (!over) return null;

    const data = over.data.current;
    if (isSortableItemData(data)) {
        return { containerId: data.sortable.containerId, index: data.sortable.index };
    }
    if (isContainerDropData(data)) {
        const list = findContainerList(blocks, data.containerId) ?? [];
        return { containerId: data.containerId, index: list.length };
    }
    return null;
}

function getCurrentBlocks(): BlockData[] {
    const state = useEditorStore.getState();
    return state.slides.find((s) => s.id === state.activeSlideId)?.blocks ?? [];
}

export default function EditorBlockDndContext({ children }: { children: React.ReactNode }) {
    const slides = useEditorStore((state) => state.slides);
    const activeSlideId = useEditorStore((state) => state.activeSlideId);
    const moveBlock = useEditorStore((state) => state.moveBlock);
    const spawnBlockAt = useEditorStore((state) => state.spawnBlockAt);
    const removeBlock = useEditorStore((state) => state.removeBlock);
    const setSelectedBlockId = useEditorStore((state) => state.setSelectedBlockId);

    const blocks = slides.find((s) => s.id === activeSlideId)?.blocks ?? [];

    const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
    const [overlaySize, setOverlaySize] = useState<{ width: number; height: number } | null>(null);
    // BlockSelectorからのドラッグで新規生成したブロックのID(通常ブロックのドラッグではnull)
    const spawnedBlockIdRef = useRef<string | null>(null);
    // 直前にコンテナ間移動を適用した(containerId, index)を覚えておき、同じ移動を無駄に繰り返さないようにする。
    // また、何らかの理由でホバー先の判定が高頻度に往復し続けるケースに備えて、
    // 1回のドラッグ操作あたりの移動回数に上限を設け、無限ループ的な状態更新の連鎖を防ぐ
    const lastAppliedMoveRef = useRef<{ containerId: string; index: number } | null>(null);
    const moveCountRef = useRef(0);
    const MAX_MOVES_PER_DRAG = 5000;

    // onDragOverはポインタが動くたびに(ブラウザのイベント頻度次第で1フレームに何度も)発火しうる。
    // 呼ばれるたびに同期的にmoveBlockを実行すると、コンテナ境界付近での高頻度なホバー切り替え時に
    // Reactの再レンダーが追いつかないまま状態更新が連鎖し、「Maximum update depth exceeded」につながる。
    // そのため実際の移動は requestAnimationFrame で1フレームにつき最大1回にまとめて適用する
    const rafIdRef = useRef<number | null>(null);
    const pendingMoveRef = useRef<{ activeBlockId: string; containerId: string; index: number } | null>(null);

    const cancelPendingMove = () => {
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        pendingMoveRef.current = null;
    };

    const flushPendingMove = () => {
        rafIdRef.current = null;
        const pending = pendingMoveRef.current;
        pendingMoveRef.current = null;
        if (!pending) return;

        const last = lastAppliedMoveRef.current;
        if (last && last.containerId === pending.containerId && last.index === pending.index) return;
        if (moveCountRef.current >= MAX_MOVES_PER_DRAG) return;

        moveBlock(pending.activeBlockId, pending.containerId, pending.index);
        lastAppliedMoveRef.current = { containerId: pending.containerId, index: pending.index };
        moveCountRef.current += 1;
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const data = active.data.current;

        cancelPendingMove();
        lastAppliedMoveRef.current = null;
        moveCountRef.current = 0;

        if (isPaletteDragData(data)) {
            const defaultParams = BLOCK_DEFAULTS[data.blockType] ?? {};
            // その場では位置を確定させず、末尾に生成してから dragOver/dragEnd で本来の位置に移動させる。
            // パレットからの新規配置は、この後リアルタイムに実データが動く様子自体がプレビューになるため
            // DragOverlayは出さない(元々サイズを持たないボタンなので固定サイズのプレビューにする意味が薄い)
            const blockId = spawnBlockAt(data.blockType, defaultParams, ROOT_CONTAINER_ID, getCurrentBlocks().length);
            spawnedBlockIdRef.current = blockId;
            setDraggedBlockId(null);
            setOverlaySize(null);
            return;
        }

        spawnedBlockIdRef.current = null;
        const blockId = active.id as string;
        setDraggedBlockId(blockId);

        // dnd-kitのactive.rect.current.initialはこの時点ではまだ計測されていないことがあるため、
        // 実DOMのサイズを直接測ってドラッグ中に表示するプレビューのサイズを固定する
        const node = document.querySelector<HTMLElement>(`[data-block-id="${blockId}"]`);
        const rect = node?.getBoundingClientRect();
        setOverlaySize(rect ? { width: rect.width, height: rect.height } : null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const activeBlockId = spawnedBlockIdRef.current ?? (event.active.id as string);
        const currentBlocks = getCurrentBlocks();

        const target = resolveOverTarget(event.over, currentBlocks);
        if (!target) return;

        const activeContainerId = findContainerIdForBlock(currentBlocks, activeBlockId);
        if (!activeContainerId || activeContainerId === target.containerId) return;

        // 他コンテナへのホバー: 実データの移動(リアルタイムに詰めて表示する処理)は
        // 次の描画フレームでまとめて適用する(flushPendingMove参照)
        pendingMoveRef.current = { activeBlockId, containerId: target.containerId, index: target.index };
        if (rafIdRef.current === null) {
            rafIdRef.current = requestAnimationFrame(flushPendingMove);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        cancelPendingMove();
        const activeBlockId = spawnedBlockIdRef.current ?? (event.active.id as string);
        const currentBlocks = getCurrentBlocks();
        const target = resolveOverTarget(event.over, currentBlocks);

        if (!target) {
            // 有効なドロップ先が無いままリリースされた場合、パレットからの新規生成分は取り消す
            if (spawnedBlockIdRef.current) {
                removeBlock(spawnedBlockIdRef.current);
            }
        } else {
            // 同一コンテナ内での最終的な並び順を確定する(別コンテナへはdragOverで移動済み)
            moveBlock(activeBlockId, target.containerId, target.index);
            if (spawnedBlockIdRef.current) {
                setSelectedBlockId(spawnedBlockIdRef.current);
            }
        }

        spawnedBlockIdRef.current = null;
        setDraggedBlockId(null);
        setOverlaySize(null);
    };

    const handleDragCancel = () => {
        cancelPendingMove();
        if (spawnedBlockIdRef.current) {
            removeBlock(spawnedBlockIdRef.current);
        }
        spawnedBlockIdRef.current = null;
        setDraggedBlockId(null);
        setOverlaySize(null);
    };

    const draggedBlock = draggedBlockId ? findBlockById(blocks, draggedBlockId) : undefined;

    return (
        <DndContext
            id="editor-block-dnd-context"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            {children}

            <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                {draggedBlock && overlaySize ? (
                    <div
                        style={{ width: overlaySize.width, height: overlaySize.height }}
                        className="pointer-events-none overflow-hidden rounded-lg border-2 border-blue-400 bg-white p-4 shadow-xl"
                    >
                        <Block block={draggedBlock} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
