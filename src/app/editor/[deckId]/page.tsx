'use client';

import { use } from 'react';
import EditorHeader from '@/components/editor/EditorHeader';
import EditorFooter from '@/components/editor/EditorFooter';
import SlideNavigator from '@/components/editor/SlideNavigator';
import SlideCanvas from '@/components/editor/SlideCanvas';
import BlockSelector from '@/components/editor/BlockSelector';
import EditorBlockDndContext from '@/components/editor/EditorBlockDndContext';
import BlockSettings from '@/src/components/editor/BlockSettings/BlockSettings';
import { useSaveDeck } from '@/hooks/useSaveDeck';
import { useStartBroadcast } from '@/hooks/useStartBroadcast';
import { useLoadDeck } from '@/hooks/useLoadDeck';

export default function EditorPage({ params }: { params: Promise<{ deckId: string }> }) {
    const { deckId } = use(params);
    const { isLoading: isDeckLoading, error: deckError } = useLoadDeck(deckId);
    const { saveStatus, lastSavedAt, handleSave } = useSaveDeck(deckId);
    const { status: broadcastStatus, startBroadcast } = useStartBroadcast(deckId);

    if (isDeckLoading) {
        return (
            <div className="w-screen h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl font-bold text-gray-500 animate-pulse">デッキを読み込み中...</div>
            </div>
        );
    }

    if (deckError) {
        return (
            <div className="w-screen h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl font-bold text-red-500">デッキ読み込みエラー</div>
            </div>
        );
    }

    return (
        <div className="relative w-screen h-screen bg-gray-100 flex flex-col items-center justify-center font-sans overflow-hidden">

            <EditorHeader
                deckId={deckId}
                saveStatus={saveStatus}
                lastSavedAt={lastSavedAt}
                onSave={handleSave}
                broadcastStatus={broadcastStatus}
                onStartBroadcast={startBroadcast}
            />

            {/* --- メインエリア --- */}
            <SlideNavigator />
            <EditorBlockDndContext>
                <SlideCanvas />
                <BlockSelector />
            </EditorBlockDndContext>
            <BlockSettings />

            <EditorFooter saveStatus={saveStatus} />
        </div>
    );
}
