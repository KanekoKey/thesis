import { DynamoDBDocumentClient, QueryCommand, QueryCommandOutput, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";

const INDEX_NAME = "RoomIndex";

export function getManagementApiClient(event: APIGatewayProxyWebsocketEventV2): ApiGatewayManagementApiClient {
  const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  return new ApiGatewayManagementApiClient({ endpoint });
}

async function postOrCleanup(
  apigwClient: ApiGatewayManagementApiClient,
  connectionId: string,
  messageData: Uint8Array
): Promise<string | undefined> {
  try {
    await apigwClient.send(new PostToConnectionCommand({ ConnectionId: connectionId, Data: messageData }));
    return undefined;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "GoneException") {
      return connectionId; // 切断済み。呼び出し元でDynamoDBから削除する
    }
    console.error(`Failed to send message to ${connectionId}:`, error);
    return undefined;
  }
}

type BroadcastToRoomOptions = {
  docClient: DynamoDBDocumentClient;
  connectionsTableName: string;
  apigwClient: ApiGatewayManagementApiClient;
  roomId: string;
  payload: unknown;
  excludeConnectionId?: string;
};

// roomId に紐づく全接続へpayloadを送信する。切断済み(GoneException)の接続はConnectionsTableから削除する。
export async function broadcastToRoom({
  docClient,
  connectionsTableName,
  apigwClient,
  roomId,
  payload,
  excludeConnectionId,
}: BroadcastToRoomOptions): Promise<void> {
  const messageData = new TextEncoder().encode(JSON.stringify(payload));
  let lastEvaluatedKey: Record<string, unknown> | undefined = undefined;
  const staleConnections: string[] = [];

  do {
    const queryRes: QueryCommandOutput = await docClient.send(new QueryCommand({
      TableName: connectionsTableName,
      IndexName: INDEX_NAME,
      KeyConditionExpression: "roomId = :r",
      ExpressionAttributeValues: { ":r": roomId },
      ExclusiveStartKey: lastEvaluatedKey,
    }));

    const connections = queryRes.Items || [];
    lastEvaluatedKey = queryRes.LastEvaluatedKey;

    const results = await Promise.all(
      connections
        .filter(({ connectionId }) => connectionId !== excludeConnectionId)
        .map(({ connectionId }) => postOrCleanup(apigwClient, connectionId, messageData))
    );
    staleConnections.push(...results.filter((id): id is string => !!id));
  } while (lastEvaluatedKey);

  if (staleConnections.length > 0) {
    await Promise.all(staleConnections.map(connectionId =>
      docClient.send(new DeleteCommand({ TableName: connectionsTableName, Key: { connectionId } }))
    ));
    console.log(`Deleted ${staleConnections.length} stale connections.`);
  }
}

// 特定の1接続にだけpayloadを送信する(hostTakenOver等の個別通知用)
export async function sendToConnection(
  apigwClient: ApiGatewayManagementApiClient,
  connectionId: string,
  payload: unknown
): Promise<void> {
  const messageData = new TextEncoder().encode(JSON.stringify(payload));
  await postOrCleanup(apigwClient, connectionId, messageData);
}

// roomId に紐づく全接続のConnectionsTableレコードを取得する(ページネーション対応)
export async function queryRoomConnections(
  docClient: DynamoDBDocumentClient,
  connectionsTableName: string,
  roomId: string
): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined = undefined;

  do {
    const queryRes: QueryCommandOutput = await docClient.send(new QueryCommand({
      TableName: connectionsTableName,
      IndexName: INDEX_NAME,
      KeyConditionExpression: "roomId = :r",
      ExpressionAttributeValues: { ":r": roomId },
      ExclusiveStartKey: lastEvaluatedKey,
    }));
    items.push(...(queryRes.Items || []));
    lastEvaluatedKey = queryRes.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

// 参加者一覧(rosterUpdate)を部屋の全員に配信する。入退室のたびに呼ぶ。
export async function broadcastRoster(
  docClient: DynamoDBDocumentClient,
  connectionsTableName: string,
  apigwClient: ApiGatewayManagementApiClient,
  roomId: string
): Promise<void> {
  const connections = await queryRoomConnections(docClient, connectionsTableName, roomId);
  const participants = connections.map((c) => ({
    connectionId: c.connectionId,
    role: c.role ?? "guest",
    displayName: c.displayName,
  }));

  await broadcastToRoom({
    docClient,
    connectionsTableName,
    apigwClient,
    roomId,
    payload: { type: "rosterUpdate", participants },
  });
}
