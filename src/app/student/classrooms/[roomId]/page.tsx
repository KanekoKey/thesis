'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const WS_URL = 'wss://0ydmcdhzc8.execute-api.ap-northeast-1.amazonaws.com/prod/';

const DUMMY_BLOCKS = [
  { id: 'b1', type: 'h1', content: '第1回：インターネットの仕組み' },
  { id: 'b2', type: 'paragraph', content: '今日はWebサイトが表示される裏側について学びましょう。' },
  { id: 'b3', type: 'h2', content: '1. クライアントとサーバー' },
  { id: 'b4', type: 'paragraph', content: '私たちが使っているスマホやPCを「クライアント」、データを持っているコンピュータを「サーバー」と呼びます。' },
  { id: 'b5', type: 'paragraph', content: 'URLを入力すると、クライアントからサーバーへ「リクエスト」が送られます。' },
];

export default function StudentClassroomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('AWS WebSocketに接続しました！');
      ws.send(JSON.stringify({ action: 'joinRoom', roomId }));
    };

    // バックエンドの changeBlock.ts からブロードキャストされてくるデータを受信
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

  const activeBlock = DUMMY_BLOCKS[activeIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="absolute top-4 left-4 text-gray-500">
        クラス: {roomId}
      </div>
      <h1 className="text-2xl font-bold mb-4 text-red-500 animate-pulse">🔴 受講画面 (先生と同期中)</h1>
      <div className="max-w-4xl w-full bg-white p-12 rounded-2xl shadow-sm border text-center transition-all">
        {activeBlock.type === 'h1' && <h1 className="text-5xl font-extrabold">{activeBlock.content}</h1>}
        {activeBlock.type === 'h2' && <h2 className="text-4xl font-bold text-blue-600 border-b pb-4 inline-block">{activeBlock.content}</h2>}
        {activeBlock.type === 'paragraph' && <p className="text-2xl text-gray-700">{activeBlock.content}</p>}
      </div>
    </div>
  );
}