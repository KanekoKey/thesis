'use client';

import { useEffect, useRef, useState } from 'react';

import { useEditorStore } from '@/stores/useEditorStore';
import { useFitScale } from '@/hooks/useFitScale';
import { SlideGrid } from '@/components/slide/SlideSurface';
import { getMinSpan } from '@/lib/blockSpans';
import {
    CELL_SIZE,
    SLIDE_HEIGHT,
    SLIDE_WIDTH,
    isPlacementFree,
    moveLayout,
    resizeLayout,
} from '@/lib/slideGrid';
import type { BlockLayout } from '@/types/block';
import GridBlockItem, { type GestureMode } from './GridBlockItem';

// 移動・リサイズの操作中の状態。startLayout は操作開始時点の位置で、
// ポインタの総移動量(セル単位)をこれに加えて候補位置を求める
type Gesture = {
    blockId: string;
    mode: GestureMode;
    startX: number;
    startY: number;
    startLayout: BlockLayout;
    minSpan: { colSpan: number; rowSpan: number };
    // 他のブロックと重ならなかった直近の候補位置。ポインタが空きの無い場所に入っても、ここで止まる
    lastValid: BlockLayout;
};

// セルの目安線。エディタのみで表示し、教材提示側には出さない
const GRID_LINE_COLOR = 'rgba(59, 130, 246, 0.10)';
const GRID_BACKGROUND = {
    backgroundImage: `linear-gradient(to right, ${GRID_LINE_COLOR} 1px, transparent 1px), linear-gradient(to bottom, ${GRID_LINE_COLOR} 1px, transparent 1px)`,
    backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
};

// --- メインのキャンバス ---
export default function SlideCanvas() {
    const slides = useEditorStore((state) => state.slides);
    const activeSlideId = useEditorStore((state) => state.activeSlideId);
    const selectedBlockId = useEditorStore((state) => state.selectedBlockId);
    const setSelectedBlockId = useEditorStore((state) => state.setSelectedBlockId);
    const setBlockLayout = useEditorStore((state) => state.setBlockLayout);
    const currentSlide = slides.find(s => s.id === activeSlideId);

    // 利用可能な領域いっぱいに、16:9を保ってスライドを拡大縮小する(スライド内スクロールは無い)
    const areaRef = useRef<HTMLDivElement>(null);
    const scale = useFitScale(areaRef);
    const scaleRef = useRef(scale);
    useEffect(() => {
        scaleRef.current = scale;
    }, [scale]);

    // 操作中のブロックだけ、確定前の候補位置で描画する
    const gestureRef = useRef<Gesture | null>(null);
    const [preview, setPreview] = useState<{ blockId: string; layout: BlockLayout } | null>(null);
    const isGesturing = preview !== null;
    // 移動・リサイズのポインタアップ直後に発火する click で、背景クリック(選択解除)が誤って走らないようにする
    const suppressClickRef = useRef(false);

    const handleGestureStart = (e: React.PointerEvent, blockId: string, mode: GestureMode) => {
        const block = currentSlide?.blocks.find(b => b.id === blockId);
        if (!block) return;

        // 掴んだ時点で選択し、ブロック内部のクリック/テキスト選択などが始まらないようにする
        e.preventDefault();
        e.stopPropagation();
        setSelectedBlockId(blockId);

        gestureRef.current = {
            blockId,
            mode,
            startX: e.clientX,
            startY: e.clientY,
            startLayout: block.layout,
            minSpan: getMinSpan(block),
            lastValid: block.layout,
        };
        setPreview({ blockId, layout: block.layout });
    };

    // 操作中だけ、window でポインタを追う(枠の外までドラッグしても追従できるように)
    useEffect(() => {
        if (!isGesturing) return;

        const handleMove = (e: PointerEvent) => {
            const gesture = gestureRef.current;
            if (!gesture) return;

            // 画面上のpx移動量を、スライドの表示倍率で論理pxに戻してからセル単位に丸める(=セルにスナップ)
            const cellOnScreen = CELL_SIZE * scaleRef.current;
            const dCols = Math.round((e.clientX - gesture.startX) / cellOnScreen);
            const dRows = Math.round((e.clientY - gesture.startY) / cellOnScreen);

            const candidate = gesture.mode === 'move'
                ? moveLayout(gesture.startLayout, dCols, dRows)
                : resizeLayout(gesture.startLayout, gesture.mode, dCols, dRows, gesture.minSpan);

            const state = useEditorStore.getState();
            const slide = state.slides.find(s => s.id === state.activeSlideId);
            const others = slide?.blocks.filter(b => b.id !== gesture.blockId).map(b => b.layout) ?? [];

            if (isPlacementFree(candidate, others)) {
                gesture.lastValid = candidate;
                setPreview({ blockId: gesture.blockId, layout: candidate });
            }
        };

        const finish = (commit: boolean) => {
            const gesture = gestureRef.current;
            if (gesture && commit) {
                setBlockLayout(gesture.blockId, gesture.lastValid);
            }
            gestureRef.current = null;
            setPreview(null);
            suppressClickRef.current = true;
            setTimeout(() => { suppressClickRef.current = false; }, 0);
        };
        const handleUp = () => finish(true);
        const handleCancel = () => finish(false);

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleCancel);
        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
            window.removeEventListener('pointercancel', handleCancel);
        };
    }, [isGesturing, setBlockLayout]);

    return (
        // ヘッダー(h-14)と下部のスライドナビゲーターの分を空けた領域に収める
        <div
            ref={areaRef}
            className="absolute top-14 bottom-[136px] inset-x-0 mx-6 my-4 flex items-center justify-center"
            onClick={() => {
                if (!suppressClickRef.current) setSelectedBlockId(null);
            }}
        >
            {scale > 0 && (
                <div
                    data-slide-canvas
                    className="relative shrink-0 bg-white shadow-sm border border-gray-300"
                    style={{ width: SLIDE_WIDTH * scale, height: SLIDE_HEIGHT * scale }}
                >
                    <div className="absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
                        <SlideGrid style={GRID_BACKGROUND}>
                            {currentSlide?.blocks.map((block) => (
                                <GridBlockItem
                                    key={block.id}
                                    block={block}
                                    layout={preview?.blockId === block.id ? preview.layout : block.layout}
                                    isSelected={selectedBlockId === block.id}
                                    scale={scale}
                                    onSelect={() => setSelectedBlockId(block.id)}
                                    onGestureStart={(e, mode) => handleGestureStart(e, block.id, mode)}
                                />
                            ))}
                        </SlideGrid>
                    </div>

                    {currentSlide?.blocks.length === 0 && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="rounded-lg border-2 border-dashed border-gray-300 px-10 py-6 text-gray-400">
                                パレットから要素を追加してください
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
