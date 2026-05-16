'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Block from '@/components/blocks/Block';
import { useMaterials } from '@/hooks/useMaterials';
import type { SlideData } from '@/types/slide';

// WebSocketの接続先（AWS API Gateway）
const WS_URL = 'wss://0ydmcdhzc8.execute-api.ap-northeast-1.amazonaws.com/prod/';

export default function TeacherClassroomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  // DynamoDBから教材データを取得
  const { slides: materialSlides, isLoading, error } = useMaterials(roomId);

  // 現在表示しているブロックのインデックス
  const [activeIndex, setActiveIndex] = useState(0);

  // WebSocketインスタンスを保持
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

  // --- キーボード入力制御とWebSocket送信 ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!materialSlides || materialSlides.length === 0) return;

      // 左右キーでインデックスを変更
      let newIndex = activeIndex;
      if (e.key === 'ArrowRight') {
        newIndex = Math.min(materialSlides.length - 1, activeIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        newIndex = Math.max(0, activeIndex - 1);
      }

      // インデックスが変わったら状態を更新
      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);

        // WebSocket送信
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              action: 'changeBlock',
              roomId: roomId,
              activeIndex: newIndex,
            })
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, roomId, materialSlides]);


  // --- 画面の描画 ---

  // データ取得中の画面（ローディング）
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-500 animate-pulse">教材を読み込み中...</div>
      </div>
    );
  }

  // エラーが起きた時の画面
  if (error || !materialSlides || materialSlides.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-bold text-red-500">教材読み込みエラー</div>
      </div>
    );
  }

  // データ取得成功時のメイン画面
  const activeSlide = materialSlides[activeIndex];
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="absolute top-4 left-4 text-gray-500">
        クラス: {roomId} | スライド: {activeIndex + 1}/{materialSlides.length}
      </div>
      <h1 className="text-2xl font-bold mb-4">教員画面 (操作側)</h1>

      {/* スライド表示エリア */}
      <div className="max-w-5xl w-full bg-white p-10 rounded-3xl shadow-lg border border-gray-100 min-h-[500px]">
        <div className="flex flex-col gap-6">
          {activeSlide.blocks.map((block) => (
            <div key={block.id} className="w-full">
              <Block block={block} />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-8 text-gray-400">キーボードの ← → キーでスライド切り替え</p>
    </div>
  );
}
