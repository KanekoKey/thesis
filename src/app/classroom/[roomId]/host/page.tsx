'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { useDeck } from '@/hooks/useDeck';
import HostHeader from '@/components/classroom/HostHeader';
import ActiveSlideStage from '@/components/classroom/ActiveSlideStage';
import NextSlidePreview from '@/components/classroom/NextSlidePreview';
import SlideFilmstrip from '@/components/classroom/SlideFilmstrip';

const WS_URL = 'wss://0ydmcdhzc8.execute-api.ap-northeast-1.amazonaws.com/prod/';

export default function ClassroomHostPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const hostToken = useSearchParams().get('token');

  // roomId -> deckId の解決(教材本体はdeckIdで取得する)
  const { deckId, isLoading: isRoomLoading, error: roomError } = useRoom(roomId);
  const { slides, isLoading: isDeckLoading, error: deckError } = useDeck(deckId ?? '');

  const [activeIndex, setActiveIndex] = useState(0);
  const [isTakenOver, setIsTakenOver] = useState(false);
  const [authError, setAuthError] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // --- WebSocket接続 ---
  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      ws.send(JSON.stringify({ action: 'joinRoom', roomId, role: 'host', hostToken }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'joined') {
        // hostTokenが無効だった場合、サーバ側で強制的にguestへ降格されている
        if (data.role !== 'host') setAuthError(true);
      } else if (data.type === 'hostTakenOver') {
        // 別のタブ/端末が新たにhostTokenで認証し、この接続は閲覧専用に降格した
        setIsTakenOver(true);
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [roomId, hostToken]);

  // --- スライド切り替えとWebSocket送信 ---
  const goToSlide = (newIndex: number) => {
    if (!slides || slides.length === 0 || isTakenOver) return;
    const clampedIndex = Math.max(0, Math.min(slides.length - 1, newIndex));

    if (clampedIndex !== activeIndex) {
      setActiveIndex(clampedIndex);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            action: 'changeBlock',
            roomId: roomId,
            activeIndex: clampedIndex,
          })
        );
      }
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
  }, [activeIndex, roomId, slides, isTakenOver]);

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
      />

      {/* --- メイン: 現在のスライド + 次のスライドプレビュー --- */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        <ActiveSlideStage slide={activeSlide} />
        <NextSlidePreview slide={nextSlide} />
      </div>

      <SlideFilmstrip slides={slides} activeIndex={activeIndex} onSelect={goToSlide} />
    </div>
  );
}
