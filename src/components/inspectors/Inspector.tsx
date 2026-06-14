'use client';

import { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';

import { useEditorStore } from '@/stores/useEditorStore';
import TextInspector from './TextBlockInspector';
import CoasterInspector from './RollerCoasterBlockInspector';
import type { BlockData } from '@/types/block';

export default function Inspector() {
    // インスペクタ自体の開閉状態をこのコンポーネント内で管理
    const [isInspectorOpen, setIsInspectorOpen] = useState(true);
    // SSR時の window is not defined エラー回避
    const [isMounted, setIsMounted] = useState(false);

    // Storeから必要な情報を取得
    const selectedBlockId = useEditorStore((state) => state.selectedBlockId);
    const slides = useEditorStore((state) => state.slides);
    const activeSlideId = useEditorStore((state) => state.activeSlideId);

    // クライアント側でマウントされた後に、isMountedをtrueにする
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 0);

        return () => clearTimeout(timer);
    }, []);
    if (!isMounted) return null;

    // 選択中のブロックデータを特定
    const currentSlide = slides.find(s => s.id === activeSlideId);
    const block = currentSlide?.blocks.find(b => b.id === selectedBlockId);

    // typeに応じて適切なインスペクタパネルに振り分ける
    const renderInspectorPanel = (block: BlockData) => {
        switch (block.type) {
            case 'text':
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
                return <TextInspector blockId={block.id} params={block.parameters} />;
            case 'roller-coaster':
                return <CoasterInspector blockId={block.id} params={block.parameters} />;
            default:
                return <div className="text-sm text-gray-500 text-center py-4">設定項目がありません</div>;
        }
    };

    // パネルの中身（コンテンツ部分）を描画する関数
    const renderContent = () => {
        if (!selectedBlockId) {
            return <p className="text-sm text-gray-500 m-4 text-center">ブロックを選択してください</p>;
        }
        if (!block) {
            return <p className="text-sm text-gray-500 m-4 text-center">ブロックが見つかりません</p>;
        }

        return (
            <div className="flex flex-col h-full">
                <div className="mb-4 pb-2 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">プロパティ</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500">
                        {block.type}
                    </span>
                </div>
                {renderInspectorPanel(block)}
            </div>
        );
    };

    return (
        <Rnd
            default={{ x: window.innerWidth - 320, y: 128, width: 288, height: 'auto' }}
            minWidth={240}
            bounds="parent"
            dragHandleClassName="inspector-drag-handle"
            enableResizing={isInspectorOpen ? { left: true, bottom: true, bottomLeft: true } : false}
            className="z-20"
        >
            <div className="w-full bg-white/90 backdrop-blur-md shadow-2xl rounded-xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-200">
                {/* タイトルバー */}
                <div
                    className="inspector-drag-handle bg-blue-600 text-white px-3 py-2 text-xs font-bold flex justify-between items-center cursor-move select-none"
                    onDoubleClick={() => setIsInspectorOpen(!isInspectorOpen)}
                >
                    <span>ブロック設定</span>
                    <button
                        onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                        className="hover:text-blue-200 transition-colors px-2 py-0.5"
                    >
                        {isInspectorOpen ? '－' : '▢'}
                    </button>
                </div>

                {/* インスペクタの中身 */}
                {isInspectorOpen && (
                    <div className="p-4 flex flex-col gap-4">
                        {renderContent()}
                    </div>
                )}
            </div>
        </Rnd>
    );
}