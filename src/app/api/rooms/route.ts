import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { RoomItem } from '@/types/database';

export const dynamic = 'force-dynamic';

const client = new DynamoDBClient({ region: 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'BackendStack-RoomsTableA5C1D45B-MSBASKUICRYI';

// POST: 配信セッション(Room)を新規作成する。
// 教員がエディタで「配信を開始」を押すたびに呼ばれ、そのたびに新しい roomId / hostToken を発行する。
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const deckId = body.deckId;

    if (typeof deckId !== 'string' || !deckId) {
      return NextResponse.json(
        { error: 'deckIdは必須です' },
        { status: 400 }
      );
    }

    const roomId = randomBytes(4).toString('hex');
    const hostToken = randomBytes(16).toString('hex');

    const item: RoomItem = {
      roomId,
      deckId,
      hostToken,
      createdAt: Date.now(),
    };
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));

    return NextResponse.json({ roomId, hostToken });

  } catch (error) {
    console.error('[DynamoDB Error]', error);
    return NextResponse.json(
      { error: '配信セッションの作成に失敗しました' },
      { status: 500 }
    );
  }
}
