import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { MaterialItem } from '@/types/database';

// キャッシュをオフにして常に最新のDB情報を取得
export const dynamic = 'force-dynamic';

const client = new DynamoDBClient({ region: 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'BackendStack-MaterialsTableC00160E0-1QW0OHYL0QNT4';

// GETリクエストを処理する関数（教材データの取得）
export async function GET(
  request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const materialId = (await params).materialId;

  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { roomId: materialId },
    });
    const response = await docClient.send(command);

    if (!response.Item) {
      console.log(`[API] 教材 ${materialId} のデータがDBにありません。`);
      const emptyItem: MaterialItem = { roomId: materialId, slides: [] };
      return NextResponse.json(emptyItem);
    }

    const item = response.Item as MaterialItem;
    return NextResponse.json(item);

  } catch (error) {
    console.error('[DynamoDB Error]', error);
    return NextResponse.json(
      { error: 'データベースからの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// PUTリクエストを処理する関数（教材データの保存）
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const materialId = (await params).materialId;

  try {
    const body = await request.json();
    const slides = body.slides;

    if (!Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'slidesは配列である必要があります' },
        { status: 400 }
      );
    }

    const item: MaterialItem = {
      roomId: materialId,
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
