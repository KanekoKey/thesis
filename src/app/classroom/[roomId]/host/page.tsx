'use client';

import { useState, useEffect, useRef, use } from 'react';
import Block from '@/components/blocks/Block';
import { useDeck } from '@/hooks/useDeck';
import type { SlideData } from '@/types/slide';

const WS_URL = 'wss://0ydmcdhzc8.execute-api.ap-northeast-1.amazonaws.com/prod/';

// エディタと同じ「実寸を縮小して見せる」方式でスライドのプレビューを描画する
const SLIDE_W = 1024;
const SLIDE_H = 576;

function ScaledSlide({ slide, width }: { slide: SlideData; width: number }) {
  const height = (width * SLIDE_H) / SLIDE_W;
  const scale = width / SLIDE_W;

  return (
    <div className="relative overflow-hidden bg-white" style={{ width, height }}>
      <div
        className="absolute top-0 left-0 origin-top-left pointer-events-none flex flex-col gap-2 p-8"
        style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})` }}
      >
        {slide.blocks.map((block) => (
          <div key={block.id} className="relative p-4">
            <Block block={block} />
          </div>
        ))}
      </div>
    </div>
  );
}

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
      {/* --- ヘッダー --- */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div>
          <h1 className="font-bold text-gray-800">教員画面 (プレゼンター表示)</h1>
          <p className="text-sm text-gray-400">クラス: {roomId}</p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-500 font-medium">
            スライド {activeIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => goToSlide(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
          >
            ← 前へ
          </button>
          <button
            onClick={() => goToSlide(activeIndex + 1)}
            disabled={activeIndex === slides.length - 1}
            className="px-4 py-2 rounded-full bg-blue-600 text-white font-bold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition"
          >
            次へ →
          </button>
        </div>
      </header>

      {/* --- メイン: 現在のスライド + 次のスライドプレビュー --- */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        <div className="flex-1 flex items-center justify-center min-w-0">
          <div className="w-full h-full max-w-5xl bg-white p-10 rounded-3xl shadow-lg border border-gray-100 flex flex-col justify-center overflow-auto">
            <div className="flex flex-col gap-6">
              {activeSlide.blocks.map((block) => (
                <div key={block.id} className="w-full">
                  <Block block={block} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="w-72 shrink-0 flex flex-col gap-2">
          <p className="text-sm font-bold text-gray-500">次のスライド</p>
          {nextSlide ? (
            <div className="rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden bg-white">
              <ScaledSlide slide={nextSlide} width={272} />
            </div>
          ) : (
            <div
              className="rounded-xl border-2 border-dashed border-gray-200 bg-white flex items-center justify-center text-gray-400 text-sm"
              style={{ width: 272, height: (272 * SLIDE_H) / SLIDE_W }}
            >
              これが最後のスライドです
            </div>
          )}
        </aside>
      </div>

      {/* --- フィルムストリップ: クリックでスライド移動 --- */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-4 py-3 overflow-x-auto">
        <div className="flex gap-3 w-max">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className={`relative shrink-0 rounded-lg border-2 overflow-hidden transition-colors ${
                index === activeIndex
                  ? 'border-blue-500 ring-2 ring-blue-200/50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ScaledSlide slide={slide} width={96} />
              <span className="absolute bottom-0.5 right-0.5 bg-black/50 text-white text-[10px] leading-none px-1 py-0.5 rounded">
                {index + 1}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
