'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useDeck } from '@/hooks/useDeck';
import HostHeader from '@/components/classroom/HostHeader';
import ActiveSlideStage from '@/components/classroom/ActiveSlideStage';
import NextSlidePreview from '@/components/classroom/NextSlidePreview';
import SlideFilmstrip from '@/components/classroom/SlideFilmstrip';

const WS_URL = 'wss://0ydmcdhzc8.execute-api.ap-northeast-1.amazonaws.com/prod/';

export default function ClassroomHostPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);

  // DynamoDBからデッキデータを取得
  const { slides, isLoading, error } = useDeck(roomId);

  const [activeIndex, setActiveIndex] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  // --- WebSocket接続 ---
  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      ws.send(JSON.stringify({ action: 'joinRoom', roomId }));
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [roomId]);

  // --- スライド切り替えとWebSocket送信 ---
  const goToSlide = (newIndex: number) => {
    if (!slides || slides.length === 0) return;
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
      if (!slides || slides.length === 0) return;

      if (e.key === 'ArrowRight') {
        goToSlide(activeIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        goToSlide(activeIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, roomId, slides]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-500 animate-pulse">デッキを読み込み中...</div>
      </div>
    );
  }

  if (error || !slides || slides.length === 0) {
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
      <HostHeader
        roomId={roomId}
        activeIndex={activeIndex}
        slideCount={slides.length}
        onPrev={() => goToSlide(activeIndex - 1)}
        onNext={() => goToSlide(activeIndex + 1)}
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
