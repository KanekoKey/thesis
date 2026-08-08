'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { useDeck } from '@/hooks/useDeck';
import { useClassroomConnection } from '@/hooks/useClassroomConnection';
import { ClassroomSyncProvider } from '@/contexts/ClassroomSyncContext';
import HostHeader from '@/components/classroom/HostHeader';
import ActiveSlideStage from '@/components/classroom/ActiveSlideStage';
import NextSlidePreview from '@/components/classroom/NextSlidePreview';
import SlideFilmstrip from '@/components/classroom/SlideFilmstrip';
import ParticipantRosterPanel from '@/components/classroom/ParticipantRosterPanel';

export default function ClassroomHostPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const hostToken = useSearchParams().get('token');

  // roomId -> deckId の解決(教材本体はdeckIdで取得する)
  const { deckId, isLoading: isRoomLoading, error: roomError } = useRoom(roomId);
  const { slides, isLoading: isDeckLoading, error: deckError } = useDeck(deckId ?? '');

  const {
    wsStatus, activeIndex: syncedIndex, myConnectionId, resolvedRole, isTakenOver, roster,
    blockSync, blockStates, send,
  } = useClassroomConnection({ roomId, role: 'host', hostToken, enabled: true });

  const authError = resolvedRole !== null && resolvedRole !== 'host';

  // 表示は即座にローカルで反映しつつ(操作感優先)、サーバ側の権威あるindexで追従補正する
  // (再接続・テイクオーバー時など)
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    setActiveIndex(syncedIndex);
  }, [syncedIndex]);

  // --- スライド切り替えとWebSocket送信 ---
  const goToSlide = (newIndex: number) => {
    if (!slides || slides.length === 0 || isTakenOver) return;
    const clampedIndex = Math.max(0, Math.min(slides.length - 1, newIndex));
    if (clampedIndex !== activeIndex) {
      setActiveIndex(clampedIndex);
      send('changeBlock', { activeIndex: clampedIndex });
    }
  };

  // --- キーボード入力制御 ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!slides || slides.length === 0 || isTakenOver) return;
      if (e.key === 'ArrowRight') {
        goToSlide(activeIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        goToSlide(activeIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, slides, isTakenOver]);

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-bold text-red-500">
          この配信を管理する権限がありません(リンクが無効です)
        </div>
      </div>
    );
  }

  if (isRoomLoading || isDeckLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-500 animate-pulse">デッキを読み込み中...</div>
      </div>
    );
  }

  if (roomError || deckError || !slides || slides.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-bold text-red-500">デッキ読み込みエラー</div>
      </div>
    );
  }

  const activeSlide = slides[activeIndex];
  const nextSlide = slides[activeIndex + 1];

  return (
    <ClassroomSyncProvider
      myConnectionId={myConnectionId}
      isHost={true}
      roster={roster}
      blockSync={blockSync}
      blockStates={blockStates}
      send={send}
    >
      <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
        {isTakenOver && (
          <div className="shrink-0 bg-amber-500 text-white text-sm font-bold text-center py-2">
            別のタブ・端末でホストとして再接続されました。この画面はもう操作できません。
          </div>
        )}

        <HostHeader
          roomId={roomId}
          activeIndex={activeIndex}
          slideCount={slides.length}
          onPrev={() => goToSlide(activeIndex - 1)}
          onNext={() => goToSlide(activeIndex + 1)}
          disabled={isTakenOver}
          syncStatus={wsStatus}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* --- メイン: 現在のスライド + 次のスライドプレビュー --- */}
          <div className="flex-1 flex gap-6 p-6 overflow-hidden">
            <ActiveSlideStage slide={activeSlide} />
            <NextSlidePreview slide={nextSlide} />
          </div>

          <ParticipantRosterPanel roster={roster} />
        </div>

        <SlideFilmstrip slides={slides} activeIndex={activeIndex} onSelect={goToSlide} />
      </div>
    </ClassroomSyncProvider>
  );
}
