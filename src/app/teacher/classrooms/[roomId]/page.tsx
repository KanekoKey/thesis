'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Block from '@/components/blocks/Block';
import { useMaterials } from '@/hooks/useMaterials';

const WS_URL = 'wss://0ydmcdhzc8.execute-api.ap-northeast-1.amazonaws.com/prod/';

export default function TeacherClassroomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  // 教材を取得
  const { blocks: materialBlocks, isLoading, error } = useMaterials(roomId);
  
  const [activeIndex, setActiveIndex] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  // 1. ページを開いたときにWebSocketに接続
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('AWS WebSocketに接続しました！');
      ws.send(JSON.stringify({ action: 'joinRoom', roomId }));
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [roomId]);

  // 2. キーボード操作とデータ送信
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (materialBlocks.length === 0) return;

      let newIndex = activeIndex;
      if (e.key === 'ArrowDown') {
        newIndex = Math.min(materialBlocks.length - 1, activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        newIndex = Math.max(0, activeIndex - 1);
      }

      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex); // 自分の画面を更新

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
  }, [activeIndex, roomId, materialBlocks]);

// --- 画面の描画 ---

  // ① データ取得中の画面（ローディング）
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-500 animate-pulse">教材を読み込み中...</div>
      </div>
    );
  }

  // ② エラーが起きた時の画面
  if (error || !materialBlocks || materialBlocks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-bold text-red-500">教材読み込みエラー</div>
      </div>
    );
  }

  // ③ データ取得成功時のメイン画面
  const activeBlock = materialBlocks[activeIndex];
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="absolute top-4 left-4 text-gray-500">
        クラス: {roomId} | ブロック: {activeIndex + 1}/{materialBlocks.length}
      </div>
      <h1 className="text-2xl font-bold mb-4">教員画面 (操作側)</h1>
      <div className="max-w-4xl w-full bg-white p-12 rounded-2xl shadow-sm border text-center min-h-[300px] flex items-center justify-center">
        <Block type={activeBlock.type}>
          {activeBlock.content}
        </Block>
      </div>
      <p className="mt-8 text-gray-400">キーボードの上下キーで操作</p>
    </div>
  );
}