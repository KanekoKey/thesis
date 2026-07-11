'use client';

import { LayoutPanelTop, Loader2, Save } from 'lucide-react';
import type { SaveStatus } from '@/hooks/useSaveDeck';

interface EditorHeaderProps {
    deckId: string;
    saveStatus: SaveStatus;
    lastSavedAt: Date | null;
    onSave: () => void;
}

export default function EditorHeader({ deckId, saveStatus, lastSavedAt, onSave }: EditorHeaderProps) {
    return (
        <header className="absolute top-0 w-full h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between z-10">
            <div className="flex items-center gap-2 text-gray-700">
                <LayoutPanelTop className="w-5 h-5 text-blue-600" strokeWidth={2.25} />
                <span className="font-bold text-sm">スライドエディタ</span>
                <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {deckId}
                </span>
            </div>

            <div className="flex items-center gap-3">
                {lastSavedAt && saveStatus === 'idle' && (
                    <span className="text-xs text-gray-400">
                        最終保存 {lastSavedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
                <button
                    onClick={onSave}
                    disabled={saveStatus === 'saving'}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-bold transition-colors active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
                >
                    {saveStatus === 'saving' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saveStatus === 'saving' ? '保存中...' : '保存'}
                </button>
            </div>
        </header>
    );
}
