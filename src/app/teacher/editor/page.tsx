'use client';

import { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';

export default function EditorScreen() {
    // インスペクタ（右側の設定パネル）の折りたたみ状態を管理
    const [isInspectorOpen, setIsInspectorOpen] = useState(true);
    
    // SSR時の window is not defined エラーを回避するためのマウント判定
    const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
        // 同期的なState更新による警告を回避するため、setTimeoutで非同期にマウント判定を行う
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 0);
        
        // クリーンアップ関数
        return () => clearTimeout(timer);
    }, []);
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
            {/* 常に16:9 (aspect-video) を保つ */}
            <div className="w-[85vw] max-w-[1024px] aspect-video bg-white shadow-sm border border-gray-300 relative mt-8 flex flex-col z-0">
                <div className="p-8 flex-1 overflow-y-auto">
                    <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-100 pb-2 mb-6">
                        力学的エネルギーの保存
                    </h2>
                    
                    {/* 選択中のブロックを想定したハイライト */}
                    <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50/30 relative group">
                        <div className="absolute -top-3 -left-3 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-sm cursor-move">
                            <span className="text-xs">✥</span>
                        </div>
                        <p className="text-gray-600">ここにジェットコースターのシミュレータが配置されます。</p>
                    </div>
                </div>
            </div>

            {/* --- 左側：コンポーネントパレット --- */}
            {/* ブラウザでのマウント完了後に表示（SSRエラー回避） */}
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
                            <button className="p-2 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left text-sm text-gray-700 flex items-center gap-2 transition-colors">
                                <span className="text-lg">📝</span> テキスト
                            </button>
                            <button className="p-2 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left text-sm text-gray-700 flex items-center gap-2 transition-colors">
                                <span className="text-lg">∑</span> 数式 (TeX)
                            </button>
                            
                            <div className="text-xs font-bold text-gray-400 mt-2 mb-1">動的要素</div>
                            <button className="p-2 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left text-sm text-gray-700 flex items-center gap-2 transition-colors">
                                <span className="text-lg">🎢</span> シミュレータ
                            </button>
                        </div>
                    </div>
                </Rnd>
            )}

            {/* --- 右側：インスペクタ（設定パネル） --- */}
            {/* ブラウザでのマウント完了後に表示（window.innerWidth の利用） */}
            {isMounted && (
                <Rnd
                    default={{ x: window.innerWidth - 320, y: 128, width: 288, height: 'auto' }}
                    minWidth={240}
                    bounds="parent"
                    dragHandleClassName="inspector-drag-handle"
                    enableResizing={isInspectorOpen ? { left: true, bottom: true, bottomLeft: true } : false} 
                    className="z-20"
                >
                    <div className="w-full bg-white/90 backdrop-blur-md shadow-2xl rounded-xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-200">
                        {/* タイトルバー（ダブルクリックで折りたたみ） */}
                        <div 
                            className="inspector-drag-handle bg-blue-600 text-white px-3 py-2 text-xs font-bold flex justify-between items-center cursor-move select-none"
                            onDoubleClick={() => setIsInspectorOpen(!isInspectorOpen)}
                        >
                            <span>インスペクタ (設定)</span>
                            <button 
                                onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                                className="hover:text-blue-200 transition-colors px-2 py-0.5"
                            >
                                {isInspectorOpen ? '＿' : '□'}
                            </button>
                        </div>
                        
                        {/* フォームの中身（isInspectorOpen が true の時だけ表示） */}
                        {isInspectorOpen && (
                            <div className="p-4 flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-gray-500">コース形状</label>
                                    <select className="border border-gray-300 rounded p-1.5 text-sm bg-gray-50 outline-none focus:border-blue-500">
                                        <option>ループ</option>
                                        <option>キャメルバック</option>
                                        <option>ドロップ</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-gray-500">質量 (kg)</label>
                                    <input type="number" defaultValue={10} className="border border-gray-300 rounded p-1.5 text-sm bg-gray-50 outline-none focus:border-blue-500" />
                                </div>
                                <div className="pt-2 mt-2 border-t border-gray-100 flex justify-end">
                                    <button className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded font-bold transition-colors">
                                        ブロックを削除
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </Rnd>
            )}

        </div>
    );
}