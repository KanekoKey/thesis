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

export default function EditorPage({ params }: { params: Promise<{ deckId: string }> }) {
    const { deckId } = use(params);
    const { saveStatus, lastSavedAt, handleSave } = useSaveDeck(deckId);
    const { status: broadcastStatus, startBroadcast } = useStartBroadcast(deckId);

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
