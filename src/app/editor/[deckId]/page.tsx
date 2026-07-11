'use client';

import { use, useState } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import SlideNavigator from '@/components/editor/SlideNavigator';
import SlideCanvas from '@/components/editor/SlideCanvas';
import BlockSelector from '@/components/editor/BlockSelector';
import BlockSettings from '@/src/components/editor/BlockSettings/BlockSettings';

export default function EditorPage({ params }: { params: Promise<{ deckId: string }> }) {
    const { deckId } = use(params);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // --- 保存のハンドラー（DBへ保存） ---
    const handleSave = async () => {
        const slides = useEditorStore.getState().slides;

        setIsSaving(true);
        setSaveError(null);
        try {
            const response = await fetch(`/api/classrooms/${deckId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slides }),
            });
            if (!response.ok) throw new Error('保存に失敗しました');
        } catch (err) {
            console.error(err);
            setSaveError('保存に失敗しました');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="relative w-screen h-screen bg-gray-100 flex flex-col items-center justify-center font-sans overflow-hidden">

            {/* --- ヘッダー --- */}
            <header className="absolute top-0 w-full h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between z-10">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-bold transition-colors active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        {isSaving ? '保存中...' : '保存'}
                    </button>
                    {saveError && (
                        <span className="text-sm text-red-500">{saveError}</span>
                    )}
                </div>
            </header>

            {/* --- メインエリア --- */}
            <SlideNavigator />
            <SlideCanvas />
            <BlockSelector />
            <BlockSettings />
        </div>
    );
}