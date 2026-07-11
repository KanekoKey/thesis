import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { DeckItem } from '@/types/database';

export const dynamic = 'force-dynamic';

const client = new DynamoDBClient({ region: 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'BackendStack-DecksTable1391E269-JGSFC4OUVRAF';

// GET: デッキデータの取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const deckId = (await params).deckId;

  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { roomId: deckId },
    });
    const response = await docClient.send(command);

    if (!response.Item) {
      const emptyItem: DeckItem = { roomId: deckId, slides: [] };
      return NextResponse.json(emptyItem);
    }

    const item = response.Item as DeckItem;
    return NextResponse.json(item);

  } catch (error) {
    console.error('[DynamoDB Error]', error);
    return NextResponse.json(
      { error: 'データベースからの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// PUT: デッキデータの保存
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const deckId = (await params).deckId;

  try {
    const body = await request.json();
    const slides = body.slides;

    if (!Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'slidesは配列である必要があります' },
        { status: 400 }
      );
    }

    const item: DeckItem = {
      roomId: deckId,
      slides,
      updatedAt: new Date().toISOString(),
    };
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    });
    await docClient.send(command);

    return NextResponse.json(item);

  } catch (error) {
    console.error('[DynamoDB Error]', error);
    return NextResponse.json(
      { error: 'データベースへの保存に失敗しました' },
      { status: 500 }
    );
  }
}
