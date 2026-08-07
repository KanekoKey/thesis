'use client';

import { useState, use } from 'react';
import Block from '@/components/blocks/Block';
import { useRoom } from '@/hooks/useRoom';
import { useDeck } from '@/hooks/useDeck';
import { useClassroomConnection } from '@/hooks/useClassroomConnection';
import { ClassroomSyncProvider } from '@/contexts/ClassroomSyncContext';

export default function ClassroomGuestPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);

  // roomId -> deckId の解決(教材本体はdeckIdで取得する)
  const { deckId, isLoading: isRoomLoading, error: roomError } = useRoom(roomId);
  const { slides, isLoading: isDeckLoading, error: deckError } = useDeck(deckId ?? '');

  // ニックネーム入力(本人確認なし、ロスターパネル表示用のラベルにすぎない)
  const [nameInput, setNameInput] = useState('');
  const [displayName, setDisplayName] = useState<string | null>(null);

  const {
    activeIndex, myConnectionId, roster, blockSync, blockStates, send,
  } = useClassroomConnection({
    roomId,
    role: 'guest',
    displayName,
    enabled: !!displayName, // ニックネーム確定前は接続しない
  });

  if (!displayName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = nameInput.trim();
            if (trimmed) setDisplayName(trimmed);
          }}
          className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col gap-4"
        >
          <h1 className="text-lg font-bold text-gray-800">授業に参加</h1>
          <p className="text-sm text-gray-400">
            表示名を入力してください。本人確認は行われません。
          </p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="例: たなか"
            autoFocus
            maxLength={20}
            className="border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            type="submit"
            disabled={!nameInput.trim()}
            className="px-4 py-2 rounded-lg bg-red-500 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 transition"
          >
            参加する
          </button>
        </form>
      </div>
    );
  }

  if (isRoomLoading || isDeckLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-500 animate-pulse">授業の準備を待っています...</div>
      </div>
    );
  }

  if (roomError || deckError || !slides || slides.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-bold text-red-500">授業データが見つかりません (ID: {roomId})</div>
      </div>
    );
  }

  const activeSlide = slides[activeIndex];

  return (
    <ClassroomSyncProvider
      myConnectionId={myConnectionId}
      isHost={false}
      roster={roster}
      blockSync={blockSync}
      blockStates={blockStates}
      send={send}
    >
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="absolute top-4 left-4 text-gray-500">
          {displayName} | クラス: {roomId} | {activeIndex + 1} / {slides.length}
        </div>

        <h1 className="text-2xl font-bold mb-4 text-red-500 animate-pulse">
          🔴 受講画面 (先生と同期中)
        </h1>

        <div className="max-w-5xl w-full bg-white p-10 rounded-3xl shadow-lg border border-gray-100 min-h-[500px]">
          <div className="flex flex-col gap-6">
            {activeSlide.blocks.map((block) => (
              <div key={block.id} className="w-full">
                <Block block={block} />
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-gray-400 text-sm">
          先生が画面を操作すると、自動的に切り替わります
        </p>
      </div>
    </ClassroomSyncProvider>
  );
}
