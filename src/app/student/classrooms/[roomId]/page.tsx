'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Block from '@/components/blocks/Block';
import { useMaterials } from '@/hooks/useMaterials';

// WebSocketの接続先（AWS API Gateway）
const WS_URL = 'wss://0ydmcdhzc8.execute-api.ap-northeast-1.amazonaws.com/prod/';

export default function StudentClassroomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  // DynamoDBから教材データを取得
  const { blocks: materialBlocks, isLoading, error } = useMaterials(roomId);

  // 現在表示しているブロックのインデックス
  const [activeIndex, setActiveIndex] = useState(0);
  
  // --- WebSocket接続とインデックス同期 ---
  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      ws.send(JSON.stringify({ action: 'joinRoom', roomId }));
    };

    // 教師側からのインデックス更新を受信
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (typeof data.activeIndex === 'number') {
        setActiveIndex(data.activeIndex);
      }
    };

    return () => {
      ws.close();
    };
  }, [roomId]);


// --- 画面の描画 ---

  // データ取得中の画面（ローディング）
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-500 animate-pulse">授業の準備を待っています...</div>
      </div>
    );
  }

  // エラーが起きた時の画面
  if (error || !materialBlocks || materialBlocks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-bold text-red-500">授業データが見つかりません (ID: {roomId})</div>
      </div>
    );
  }

  // データ取得成功時のメイン画面
  const activeBlock = materialBlocks[activeIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      {/* 上部のステータスバー */}
      <div className="absolute top-4 left-4 text-gray-500">
        クラス: {roomId} | {activeIndex + 1} / {materialBlocks.length}
      </div>

      <h1 className="text-2xl font-bold mb-4 text-red-500 animate-pulse">
        🔴 受講画面 (先生と同期中)
      </h1>

      {/* 教材表示部分 */}
      <div className="max-w-4xl w-full bg-white p-12 rounded-2xl shadow-sm border text-center min-h-[300px] flex items-center justify-center transition-all duration-500">
        <Block type={activeBlock.type}>
          {activeBlock.content}
        </Block>
      </div>

      <p className="mt-8 text-gray-400 text-sm">
        先生が画面を操作すると、自動的に切り替わります
      </p>
    </div>
  );
}