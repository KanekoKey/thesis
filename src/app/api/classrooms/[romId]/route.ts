// src/app/api/classrooms/[roomId]/route.ts
import { NextResponse } from 'next/server';
import type { BlockData } from '@/types/block';

// ※いずれDynamoDBから取得しますが、今はテストとしてダミーデータを返します
const DUMMY_BLOCKS: BlockData[] = [
  { id: 'b1', type: 'h1', content: '第1回：インターネットの仕組み' },
  { id: 'b2', type: 'text', content: '今日はWebサイトが表示される裏側について学びましょう。' },
  { id: 'b3', type: 'h2', content: '1. クライアントとサーバー' },
  { id: 'b4', type: 'text', content: '私たちが使っているスマホやPCを「クライアント」、データを持っているコンピュータを「サーバー」と呼びます。' },
  { id: 'b5', type: 'text', content: 'URLを入力すると、クライアントからサーバーへ「リクエスト」が送られます。' },
  { id: 'b6', type: 'h3', content: 'Webブラウザの役割' },
  { id: 'b7', type: 'h4', content: 'Google Chrome、Safari、Edgeなど' },
];

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const roomId = params.roomId;

  // 将来ここを「DynamoDBからroomIdに一致するデータを取得する処理」に書き換えます
  console.log(`[API] クラスルーム ${roomId} のデータをリクエストされました！`);

  // 少しだけ通信の遅延（ロード時間）をシミュレート（1秒待つ）
  // これにより、フロント側で「読み込み中...」の画面がちゃんと機能するかテストできます
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 取得したデータをJSONとしてフロントエンドに返す
  return NextResponse.json({
    roomId: roomId,
    blocks: DUMMY_BLOCKS,
  });
}