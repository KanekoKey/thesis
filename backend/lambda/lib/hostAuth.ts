import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const ROOM_SK = "__room__";

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
