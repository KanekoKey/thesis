'use client';

import { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';

import { useEditorStore } from '@/stores/useEditorStore';
import type { BlockType } from '@/types/block';
import { BLOCK_DEFAULTS } from '@/components/blocks/defaults';
import Inspector from '@/components/inspectors/Inspector';
import SortableBlockItem from '@/components/SortableBlockItem';

export default function EditorScreen() {

    // コンポーネントのマウント状態を管理
    const [isMounted, setIsMounted] = useState(false);

    // Zustand Store から状態と関数を取得
    const addBlock = useEditorStore((state) => state.addBlock);
    const slides = useEditorStore((state) => state.slides);
    const activeSlideId = useEditorStore((state) => state.activeSlideId);
    const selectedBlockId = useEditorStore((state) => state.selectedBlockId);
    const setSelectedBlockId = useEditorStore((state) => state.setSelectedBlockId);
    const currentSlide = slides.find(s => s.id === activeSlideId);

    // コンポーネントがクライアント側でマウントされた後に、isMountedをtrueにする
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    // --- ブロック追加のハンドラー ---
    const handleAddBlock = (type: BlockType) => {
        const defaultParams = BLOCK_DEFAULTS[type] || {};
        addBlock(type, defaultParams);
    };

    // --- ドラッグ＆ドロップの設定 ---
    const moveBlock = useEditorStore((state) => state.moveBlock);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        // active: 掴んだブロック, over: 落とした場所の下にあるブロック
        if (over && active.id !== over.id) {
            moveBlock(active.id as string, over.id as string);
        }
    };

    return (
        <div className="relative w-screen h-screen bg-gray-100 flex flex-col items-center justify-center font-sans overflow-hidden">

            {/* --- ヘッダー --- */}
            <header className="absolute top-0 w-full h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between z-10">
                <div className="font-bold text-gray-700">統合教材エディタ</div>
                <div className="flex gap-2">
                    <button className="px-4 py-1.5 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 font-bold transition-colors">プレビュー</button>
                    <button className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-bold transition-colors">保存</button>
                </div>
            </header>

            {/* --- 中央：スライドキャンバス --- */}
            <div className="w-[85vw] max-w-[1024px] aspect-video bg-white shadow-sm border border-gray-300 relative mt-8 flex flex-col z-0">
                <div className="p-8 flex-1 overflow-y-auto">
                    <DndContext 
                        sensors={sensors} 
                        collisionDetection={closestCenter} 
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext 
                            items={currentSlide?.blocks.map(b => b.id) || []} 
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="flex flex-col gap-2">
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
                    </DndContext>
                </div>
            </div>

            {/* --- 左側：コンポーネントパレット --- */}
            {isMounted && (
                <Rnd
                    default={{ x: 24, y: 96, width: 256, height: 'auto' }}
                    minWidth={200}
                    bounds="parent"
                    dragHandleClassName="palette-drag-handle"
                    enableResizing={{ right: true, bottom: true, bottomRight: true }}
                    className="z-20"
                >
                    <div className="w-full h-full bg-white/80 backdrop-blur-md shadow-xl rounded-xl border border-gray-200 overflow-hidden flex flex-col">
                        {/* タイトルバー（ドラッグの取っ手） */}
                        <div className="palette-drag-handle bg-gray-800 text-white px-3 py-2 text-xs font-bold flex justify-between items-center cursor-move select-none">
                            <span>コンポーネント</span>
                            <span className="text-gray-400">≡</span>
                        </div>
                        {/* パレットの中身 */}
                        <div className="p-3 flex flex-col gap-2 overflow-y-auto">
                            <div className="text-xs font-bold text-gray-400 mb-1">静的要素</div>
                            <button
                                onClick={() => handleAddBlock('text')}
                                className="p-2 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left text-sm text-gray-700 flex items-center gap-2 transition-colors"
                            >
                                <span className="text-lg">📝</span> テキスト
                            </button>
                            <button
                                onClick={() => handleAddBlock('h1')}
                                className="p-2 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left text-sm text-gray-700 flex items-center gap-2 transition-colors"
                            >
                                <span className="text-lg">📝</span> 見出し1
                            </button>
                            <button
                                onClick={() => handleAddBlock('h2')}
                                className="p-2 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left text-sm text-gray-700 flex items-center gap-2 transition-colors"
                            >
                                <span className="text-lg">📝</span> 見出し2
                            </button>
                            <button
                                onClick={() => handleAddBlock('h3')}
                                className="p-2 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left text-sm text-gray-700 flex items-center gap-2 transition-colors"
                            >
                                <span className="text-lg">📝</span> 見出し3
                            </button>
                            <button
                                onClick={() => handleAddBlock('h4')}
                                className="p-2 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left text-sm text-gray-700 flex items-center gap-2 transition-colors"
                            >
                                <span className="text-lg">📝</span> 見出し4
                            </button>

                            <div className="text-xs font-bold text-gray-400 mt-2 mb-1">動的要素</div>
                            <button
                                onClick={() => handleAddBlock('counter')}
                                className="p-2 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left text-sm text-gray-700 flex items-center gap-2 transition-colors"
                            >
                                <span className="text-lg">🔢</span> カウンター
                            </button>
                            <button
                                onClick={() => handleAddBlock('roller-coaster')}
                                className="p-2 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left text-sm text-gray-700 flex items-center gap-2 transition-colors"
                            >
                                <span className="text-lg">🎢</span> シミュレータ
                            </button>
                        </div>
                    </div>
                </Rnd>
            )}

            {/* --- 右側：ブロック設定 --- */}
            <Inspector />
        </div>
    );
}