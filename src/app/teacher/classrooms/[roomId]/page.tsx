'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

const WS_URL = 'wss://0ydmcdhzc8.execute-api.ap-northeast-1.amazonaws.com/prod/';

const DUMMY_BLOCKS = [
  { id: 'b1', type: 'h1', content: '第1回：インターネットの仕組み' },
  { id: 'b2', type: 'paragraph', content: '今日はWebサイトが表示される裏側について学びましょう。' },
  { id: 'b3', type: 'h2', content: '1. クライアントとサーバー' },
  { id: 'b4', type: 'paragraph', content: '私たちが使っているスマホやPCを「クライアント」、データを持っているコンピュータを「サーバー」と呼びます。' },
  { id: 'b5', type: 'paragraph', content: 'URLを入力すると、クライアントからサーバーへ「リクエスト」が送られます。' },
];

export default function TeacherClassroomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
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
      let newIndex = activeIndex;

      if (e.key === 'ArrowDown') {
        newIndex = Math.min(DUMMY_BLOCKS.length - 1, activeIndex + 1);
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
  }, [activeIndex, roomId]);

  const activeBlock = DUMMY_BLOCKS[activeIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="absolute top-4 left-4 text-gray-500">
        クラス: {roomId} | ブロック: {activeIndex + 1}/{DUMMY_BLOCKS.length}
      </div>
      <h1 className="text-2xl font-bold mb-4">教員画面 (操作側)</h1>
      <div className="max-w-4xl w-full bg-white p-12 rounded-2xl shadow-sm border text-center">
        {activeBlock.type === 'h1' && <h1 className="text-5xl font-extrabold">{activeBlock.content}</h1>}
        {activeBlock.type === 'h2' && <h2 className="text-4xl font-bold text-blue-600 border-b pb-4 inline-block">{activeBlock.content}</h2>}
        {activeBlock.type === 'paragraph' && <p className="text-2xl text-gray-700">{activeBlock.content}</p>}
      </div>
      <p className="mt-8 text-gray-400">キーボードの上下キーで操作</p>
    </div>
  );
}