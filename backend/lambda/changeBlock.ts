import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DeleteCommand, DynamoDBDocumentClient, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;
// GSI（Global Secondary Index）の名前を指定します
const INDEX_NAME = "RoomIndex";

export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  const apigwClient = new ApiGatewayManagementApiClient({ endpoint });

  const body = JSON.parse(event.body || "{}");
  const roomId = body.roomId;
  const activeIndex = body.activeIndex;

  if (!roomId) {
    return { statusCode: 400, body: "roomId is required" };
  }

  const messageData = new TextEncoder().encode(JSON.stringify({ activeIndex }));
  let lastEvaluatedKey: Record<string, unknown> | undefined = undefined;
  const staleConnections: string[] = [];

  // 1. Queryを使ったデータ取得（ページネーション対応）
  do {
    const queryRes: QueryCommandOutput = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: INDEX_NAME,
      KeyConditionExpression: "roomId = :r",
      ExpressionAttributeValues: { ":r": roomId },
      ExclusiveStartKey: lastEvaluatedKey,
    }));

    const connections = queryRes.Items || [];
    lastEvaluatedKey = queryRes.LastEvaluatedKey; // 次のページがある場合はキーが入る

    // 2. ブロードキャスト送信
    const postCalls = connections.map(async ({ connectionId }) => {
      try {
        await apigwClient.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: messageData,
        }));
      } catch (error: unknown) {
        //  本物のErrorオブジェクトかどうかを検査する（型の絞り込み）
        if (error instanceof Error) {
          // エラー名で「切断済み(410)」を判定する
          if (error.name === "GoneException") {
            console.log(`Stale connection detected: ${connectionId}`);
            staleConnections.push(connectionId);
          } else {
            console.error(`Failed to send message to ${connectionId}:`, error.message);
          }
        } else {
          // Errorオブジェクト以外（文字列など）が飛んできた場合のフェイルセーフ
          console.error(`Unknown error occurred with ${connectionId}:`, error);
        }
      }
    });

    await Promise.all(postCalls);

  } while (lastEvaluatedKey); // データが取り切れるまでループ

  // 4. 無効な接続をDynamoDBから一括削除（DBの肥大化を防ぐ）
  if (staleConnections.length > 0) {
    const deleteCalls = staleConnections.map(connectionId =>
      docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { connectionId }
      }))
    );
    await Promise.all(deleteCalls);
    console.log(`Deleted ${staleConnections.length} stale connections.`);
  }

  return { statusCode: 200, body: "Broadcast success" };
};