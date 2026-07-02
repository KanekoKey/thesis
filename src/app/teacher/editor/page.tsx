'use client';

import { useEditorStore } from '@/stores/useEditorStore';
import SlideNavigator from '@/components/editor/SlideNavigator';
import SlideCanvas from '@/components/editor/SlideCanvas';
import BlockSelector from '@/components/editor/BlockSelector';
import Inspector from '@/components/inspectors/Inspector';

export default function EditorScreen() {

    // --- 保存のハンドラー ---
    const handleSave = () => {
        const slides = useEditorStore.getState().slides;
        const jsonString = JSON.stringify({
            version: '1.0.0',
            updatedAt: new Date().toISOString(),
            slides: slides
        }, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `slide-${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="relative w-screen h-screen bg-gray-100 flex flex-col items-center justify-center font-sans overflow-hidden">

            {/* --- ヘッダー --- */}
            <header className="absolute top-0 w-full h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between z-10">
                <div className="flex gap-2">
                    <button 
                        onClick={handleSave}
                        className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-bold transition-colors active:scale-95"
                    >
                        保存
                    </button>
                </div>
            </header>

            {/* --- メインエリア --- */}
            <SlideNavigator />
            <SlideCanvas />
            <BlockSelector />
            <Inspector />
        </div>
    );
}