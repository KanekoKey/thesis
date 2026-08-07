import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const ROOM_SK = "__room__";
const NAME_CLAIM_PREFIX = "name:";

// RoomSessionTable内で、生徒の表示名を部屋ごとに一意に予約するための sk を作る
export function nameClaimSk(displayName: string): string {
  return `${NAME_CLAIM_PREFIX}${displayName}`;
}

// "__room__" 行・名前予約行のどちらでもない = ブロックの実行時状態行かどうか
export function isBlockSessionSk(sk: string): boolean {
  return sk !== ROOM_SK && !sk.startsWith(NAME_CLAIM_PREFIX);
}

// RoomSessionTable の "__room__" 予約行から、現在の正規host接続IDを読む
export async function getActiveHostConnectionId(
  docClient: DynamoDBDocumentClient,
  roomSessionTableName: string,
  roomId: string
): Promise<string | undefined> {
  const res = await docClient.send(new GetCommand({
    TableName: roomSessionTableName,
    Key: { roomId, sk: ROOM_SK },
  }));
  return res.Item?.activeHostConnectionId;
}

// この接続が、送信者が自己申告する role ではなく、サーバが保持する正規host接続IDと一致するかどうかを判定する
export async function isActiveHost(
  docClient: DynamoDBDocumentClient,
  roomSessionTableName: string,
  roomId: string,
  connectionId: string
): Promise<boolean> {
  const activeHostConnectionId = await getActiveHostConnectionId(docClient, roomSessionTableName, roomId);
  return !!activeHostConnectionId && activeHostConnectionId === connectionId;
}

export const ROOM_SESSION_SK = ROOM_SK;
