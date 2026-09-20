'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { TriangleAlert } from 'lucide-react';

import Block from '@/components/blocks/Block';
import { useEditorStore } from '@/stores/useEditorStore';
import { gridPlacement } from '@/components/slide/SlideSurface';
import type { BlockData, BlockLayout } from '@/types/block';
import type { ResizeHandle } from '@/lib/slideGrid';
import { hasOverflow } from '@/lib/contentFit';

export type GestureMode = 'move' | ResizeHandle;

// 枠線そのものを掴んでリサイズする。見える部品は置かず、枠線に重ねた透明な当たり判定だけを持つ。
// hover した時だけ、掴める箇所(辺は青い線、角は青い点)を示す
const EDGE_HANDLES: { handle: ResizeHandle; cursor: string; line: string }[] = [
    { handle: 'n', cursor: 'ns-resize', line: 'inset-x-0 top-1/2 h-0.5' },
    { handle: 's', cursor: 'ns-resize', line: 'inset-x-0 bottom-1/2 h-0.5' },
    { handle: 'w', cursor: 'ew-resize', line: 'inset-y-0 left-1/2 w-0.5' },
    { handle: 'e', cursor: 'ew-resize', line: 'inset-y-0 right-1/2 w-0.5' },
];
const CORNER_HANDLES: { handle: ResizeHandle; cursor: string }[] = [
    { handle: 'nw', cursor: 'nwse-resize' },
    { handle: 'ne', cursor: 'nesw-resize' },
    { handle: 'se', cursor: 'nwse-resize' },
    { handle: 'sw', cursor: 'nesw-resize' },
];

// 当たり判定の画面上の太さ(px)。スライドは縮小表示されるので、論理サイズはscaleで割って補正する
const EDGE_HIT_SIZE = 10;
const CORNER_HIT_SIZE = 16;

// ブロック本体の中でも、ドラッグ(=移動)にせず本来の操作を優先する要素
const NO_DRAG_SELECTOR = 'button, input, select, textarea, a, [data-no-drag]';

// 辺の当たり判定は、枠線を中心に太さ t で、両端は角の判定(c)を避けて置く
function edgeHitStyle(handle: ResizeHandle, t: number, c: number): React.CSSProperties {
    switch (handle) {
        case 'n': return { top: -t / 2, height: t, left: c / 2, right: c / 2 };
        case 's': return { bottom: -t / 2, height: t, left: c / 2, right: c / 2 };
        case 'w': return { left: -t / 2, width: t, top: c / 2, bottom: c / 2 };
        default: return { right: -t / 2, width: t, top: c / 2, bottom: c / 2 };
    }
}

function cornerHitStyle(handle: ResizeHandle, c: number): React.CSSProperties {
    return {
        width: c,
        height: c,
        [handle.includes('n') ? 'top' : 'bottom']: -c / 2,
        [handle.includes('w') ? 'left' : 'right']: -c / 2,
    };
}

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
    // 枠の色とアイコンの表示はDOM属性に持たせ(再レンダリングの連鎖を避ける)、
    // ブロック設定パネルの警告文のために、変化した時だけストアにも記録する
    const setBlockOverflow = useEditorStore((state) => state.setBlockOverflow);
    useLayoutEffect(() => {
        const cell = cellRef.current;
        if (!cell) return;
        const overflowing = hasOverflow(cell);
        cell.dataset.overflow = String(overflowing);
        if (overflowing !== (block.id in useEditorStore.getState().overflowBlockIds)) {
            setBlockOverflow(block.id, overflowing);
        }
    });
    // ブロックが消えた/スライドが切り替わったときに、古い記録を残さない
    useEffect(() => () => setBlockOverflow(block.id, false), [block.id, setBlockOverflow]);

    const edgeHit = EDGE_HIT_SIZE / scale;
    const cornerHit = CORNER_HIT_SIZE / scale;

    // 左クリックのみ。ブロック本体では、ボタン等の上から始めた操作は移動にせず、そのまま通す
    const startGesture = (e: React.PointerEvent, mode: GestureMode) => {
        if (e.button !== 0) return;
        if (mode === 'move' && (e.target as HTMLElement).closest(NO_DRAG_SELECTOR)) return;
        onGestureStart(e, mode);
    };

    return (
        <div
            ref={cellRef}
            data-block-id={block.id}
            style={{ ...gridPlacement(layout), zIndex: isSelected ? 2 : 1 }}
            className="group relative min-w-0 min-h-0 p-1"
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            {/* ブロック本体を掴むと移動する。
                背景は不透明の白にして、裏のグリッド線がブロックの内側に透けないようにする(選択状態は枠線の色だけで示す) */}
            {/* data-block-body: 内容が収まる大きさの判定(contentFit)が、複製して測る対象の目印 */}
            <div
                data-block-body
                onPointerDown={(e) => startGesture(e, 'move')}
                className={`h-full w-full cursor-grab active:cursor-grabbing touch-none rounded-lg border-2 bg-white p-2 transition-colors group-data-[overflow=true]:border-red-500 ${
                    isSelected ? 'border-blue-500' : 'border-gray-300 group-hover:border-gray-400'
                }`}
            >
                <Block block={block} />
            </div>

            {/* はみ出し警告(アイコンのみ): 内容がセルより大きい。説明文はブロック設定パネルの該当項目の下に出す */}
            <div
                role="img"
                aria-label="はみ出し"
                style={{ transform: `scale(${1 / scale})`, transformOrigin: 'top right' }}
                className="pointer-events-none absolute top-1 right-1 hidden items-center rounded bg-red-500 p-1 text-white shadow group-data-[overflow=true]:flex"
            >
                <TriangleAlert className="h-3.5 w-3.5" />
            </div>

            {/* 枠線のリサイズ判定: 外側の p-1 を除いた、枠線の位置に合わせる。選択していなくても掴める */}
            <div className="pointer-events-none absolute inset-1">
                {EDGE_HANDLES.map(({ handle, cursor, line }) => (
                    <div
                        key={handle}
                        onPointerDown={(e) => startGesture(e, handle)}
                        style={{ ...edgeHitStyle(handle, edgeHit, cornerHit), cursor }}
                        className="group/edge pointer-events-auto absolute touch-none"
                    >
                        <div className={`absolute bg-blue-500 opacity-0 group-hover/edge:opacity-100 ${line}`} />
                    </div>
                ))}
                {CORNER_HANDLES.map(({ handle, cursor }) => (
                    <div
                        key={handle}
                        onPointerDown={(e) => startGesture(e, handle)}
                        style={{ ...cornerHitStyle(handle, cornerHit), cursor }}
                        className="group/edge pointer-events-auto absolute touch-none"
                    >
                        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 opacity-0 group-hover/edge:opacity-100" />
                    </div>
                ))}
            </div>
        </div>
    );
}
