'use client';

import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { SaveStatus } from '@/hooks/useSaveDeck';

interface EditorFooterProps {
    saveStatus: SaveStatus;
}

export default function EditorFooter({ saveStatus }: EditorFooterProps) {
    return (
        <div
            className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
                saveStatus === 'success' || saveStatus === 'error'
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
        >
            {saveStatus === 'success' && (
                <div className="flex items-center gap-2 bg-white text-emerald-600 border border-emerald-200 shadow-lg rounded-full pl-3 pr-4 py-2 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    教材を保存しました
                </div>
            )}
            {saveStatus === 'error' && (
                <div className="flex items-center gap-2 bg-white text-red-600 border border-red-200 shadow-lg rounded-full pl-3 pr-4 py-2 text-sm font-bold">
                    <AlertCircle className="w-4 h-4" />
                    保存に失敗しました
                </div>
            )}
        </div>
    );
}
