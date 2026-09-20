'use client';

import { useLayoutEffect, useRef } from 'react';
import { Move, TriangleAlert } from 'lucide-react';

import Block from '@/components/blocks/Block';
import { gridPlacement } from '@/components/slide/SlideSurface';
import type { BlockData, BlockLayout } from '@/types/block';
import type { ResizeHandle } from '@/lib/slideGrid';

export type GestureMode = 'move' | ResizeHandle;

// ハンドルごとの、ブロック枠上の位置(0=左/上, 0.5=中央, 1=右/下)とカーソル
const RESIZE_HANDLES: { handle: ResizeHandle; x: number; y: number; cursor: string }[] = [
    { handle: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
    { handle: 'n', x: 0.5, y: 0, cursor: 'ns-resize' },
    { handle: 'ne', x: 1, y: 0, cursor: 'nesw-resize' },
    { handle: 'e', x: 1, y: 0.5, cursor: 'ew-resize' },
    { handle: 'se', x: 1, y: 1, cursor: 'nwse-resize' },
    { handle: 's', x: 0.5, y: 1, cursor: 'ns-resize' },
    { handle: 'sw', x: 0, y: 1, cursor: 'nesw-resize' },
    { handle: 'w', x: 0, y: 0.5, cursor: 'ew-resize' },
];

// 操作ハンドルの画面上の大きさ(px)。スライドは縮小表示されるので、論理サイズはscaleで割って補正する
const MOVE_HANDLE_SIZE = 24;
const RESIZE_HANDLE_SIZE = 10;

interface Props {
    block: BlockData;
    // 移動・リサイズ中は、確定前のプレビュー位置がここに入る
    layout: BlockLayout;
    isSelected: boolean;
    // スライドの表示倍率(ハンドルの大きさの補正に使う)
    scale: number;
    onSelect: () => void;
    onGestureStart: (e: React.PointerEvent, mode: GestureMode) => void;
}

export default function GridBlockItem({ block, layout, isSelected, scale, onSelect, onGestureStart }: Props) {
    const cellRef = useRef<HTMLDivElement>(null);

    // 内容がセルに収まらず、クリップされている(=一部が見えていない)かを判定して data-overflow に反映する。
    // 描画のたびに測る(テキスト編集・リサイズ・パラメータ変更のいずれでも再描画されるため)。
    // 結果はReactのstateではなくDOM属性に持たせ、再レンダリングの連鎖を避ける
    useLayoutEffect(() => {
        const cell = cellRef.current;
        if (!cell) return;
        const clipped = Array.from(cell.querySelectorAll<HTMLElement>('[data-clip]'));
        const overflowing = clipped.some((el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
        cell.dataset.overflow = String(overflowing);
    });

    const moveHandleSize = MOVE_HANDLE_SIZE / scale;
    const resizeHandleSize = RESIZE_HANDLE_SIZE / scale;

    return (
        <div
            ref={cellRef}
            data-block-id={block.id}
            style={{ ...gridPlacement(layout), zIndex: isSelected ? 2 : 1 }}
            className="group relative min-w-0 min-h-0 p-1 cursor-pointer"
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            <div
                className={`h-full w-full rounded-lg border-2 p-2 transition-colors group-data-[overflow=true]:border-amber-400 ${
                    isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-transparent group-hover:border-gray-300'
                }`}
            >
                <Block block={block} />
            </div>

            {/* はみ出し警告: 内容がセルより大きい(ブロックを大きくするか、内容を減らす) */}
            <div
                style={{ transform: `scale(${1 / scale})`, transformOrigin: 'top right' }}
                className="pointer-events-none absolute top-1 right-1 hidden items-center gap-1 rounded bg-amber-400 px-1.5 py-0.5 text-xs font-bold text-white shadow group-data-[overflow=true]:flex"
            >
                <TriangleAlert className="h-3 w-3" />
                はみ出し
            </div>

            {/* 移動ハンドル: ホバー中、または選択中に表示する(Notionに倣い選択なしでも掴めるように) */}
            <div
                onPointerDown={(e) => onGestureStart(e, 'move')}
                style={{
                    width: moveHandleSize,
                    height: moveHandleSize,
                    // ブロックの左上角の外側に置く(角のリサイズハンドルと重ならないように)
                    transform: 'translate(-100%, -100%)',
                }}
                className={`absolute top-0 left-0 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm cursor-grab active:cursor-grabbing hover:scale-110 transition-opacity select-none touch-none ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
            >
                <Move style={{ width: moveHandleSize * 0.6, height: moveHandleSize * 0.6 }} />
            </div>

            {/* リサイズハンドル: 選択中のみ。掴んだ辺/角だけがセル単位で動く */}
            {isSelected &&
                RESIZE_HANDLES.map(({ handle, x, y, cursor }) => (
                    <div
                        key={handle}
                        onPointerDown={(e) => onGestureStart(e, handle)}
                        style={{
                            left: `${x * 100}%`,
                            top: `${y * 100}%`,
                            width: resizeHandleSize,
                            height: resizeHandleSize,
                            cursor,
                            transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute rounded-sm border border-blue-500 bg-white touch-none"
                    />
                ))}
        </div>
    );
}
