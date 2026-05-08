import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

// キャッシュをオフにして常に最新のDB情報を取得
export const dynamic = 'force-dynamic';

const client = new DynamoDBClient({ region: 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'BackendStack-MaterialsTableC00160E0-1QW0OHYL0QNT4';

// GETリクエストを処理する関数
export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const roomId = (await params).roomId;

  try {
    // DynamoDBからクラスルームの教材データを取得
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        roomId: roomId 
      }
    });
    const response = await docClient.send(command);

    // データが見つからなかった場合の処理
    if (!response.Item) {
      console.log(`[API] クラスルーム ${roomId} のデータがDBにありません。`);
      return NextResponse.json({ roomId: roomId, slides: [] });
    }
  
  // 取得したデータをJSONとしてフロントエンドに返す
  return NextResponse.json({
    roomId: roomId,
    slides: response.Item.slides,
  });

  // エラーが発生した場合の処理
  } catch (error) {
    console.error('[DynamoDB Error]', error);
    return NextResponse.json(
      { error: 'データベースからの取得に失敗しました' },
      { status: 500 }
    );
  }
}
