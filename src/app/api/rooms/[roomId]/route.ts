import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { RoomItem } from '@/types/database';

export const dynamic = 'force-dynamic';

const client = new DynamoDBClient({ region: 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'BackendStack-RoomsTableA5C1D45B-MSBASKUICRYI';

// GET: roomId から deckId を解決する。
// host・guest 双方から呼ばれるエンドポイントのため、hostToken はここでは返さない。
export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const roomId = (await params).roomId;

  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { roomId },
    });
    const response = await docClient.send(command);

    if (!response.Item) {
      return NextResponse.json(
        { error: 'この配信セッションは見つかりませんでした' },
        { status: 404 }
      );
    }

    const item = response.Item as RoomItem;
    return NextResponse.json({ deckId: item.deckId });

  } catch (error) {
    console.error('[DynamoDB Error]', error);
    return NextResponse.json(
      { error: 'データベースからの取得に失敗しました' },
      { status: 500 }
    );
  }
}
