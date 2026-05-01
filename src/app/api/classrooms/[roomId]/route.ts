// src/app/api/classrooms/[roomId]/route.ts
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

// DynamoDBに接続するための準備（リージョンは東京）
const client = new DynamoDBClient({ region: 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'BackendStack-MaterialsTableC00160E0-1QW0OHYL0QNT4';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const roomId = (await params).roomId;

  try {
    // DynamoDBへ「このroomIdのデータをください」という命令を作成
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        roomId: roomId 
      }
    });
    // 命令を送信してデータを受け取る
    const response = await docClient.send(command);

    // データが見つからなかった場合の処理
    if (!response.Item) {
      console.log(`[API] クラスルーム ${roomId} のデータがDBにありません。`);
      // エラーにはせず、空っぽの教材データを返す（画面を壊さないため）
      return NextResponse.json({ roomId: roomId, blocks: [] });
    }
  
  // 取得したデータをJSONとしてフロントエンドに返す
  return NextResponse.json({
    roomId: roomId,
    blocks: response.Item.blocks,
  });

  } catch (error) {
    console.error('[DynamoDB Error]', error);
    // サーバー側のエラー（500）として返す
    return NextResponse.json(
      { error: 'データベースからの取得に失敗しました' },
      { status: 500 }
    );
  }
}