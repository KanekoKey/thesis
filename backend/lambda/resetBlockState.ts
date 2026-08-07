import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { getManagementApiClient, broadcastToRoom } from "./lib/broadcast";
import { isActiveHost } from "./lib/hostAuth";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME!;
const ROOM_SESSION_TABLE_NAME = process.env.ROOM_SESSION_TABLE_NAME!;

// 教員がブロックの実行時状態を空にリセットする。
// 教材が持つ本来のデフォルト値はクライアント側(parameters)にあるため、
// サーバ側は state を空オブジェクトに戻すだけで、実際の初期値への反映はクライアントに委ねる。
export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const hostConnectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");
  const { roomId, blockId } = body;

  if (!roomId || !blockId) {
    return { statusCode: 400, body: "roomId, blockId are required" };
  }

  if (!(await isActiveHost(docClient, ROOM_SESSION_TABLE_NAME, roomId, hostConnectionId))) {
    return { statusCode: 403, body: "Forbidden" };
  }

  try {
    await docClient.send(new UpdateCommand({
      TableName: ROOM_SESSION_TABLE_NAME,
      Key: { roomId, sk: blockId },
      ConditionExpression: "attribute_exists(roomId)",
      UpdateExpression: "SET #s = :empty, updatedAt = :now",
      ExpressionAttributeNames: { "#s": "state" },
      ExpressionAttributeValues: { ":empty": {}, ":now": Date.now() },
    }));
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ConditionalCheckFailedException") {
      return { statusCode: 400, body: "Block is not in shared mode" };
    }
    throw error;
  }

  const apigwClient = getManagementApiClient(event);
  await broadcastToRoom({
    docClient,
    connectionsTableName: CONNECTIONS_TABLE_NAME,
    apigwClient,
    roomId,
    payload: { type: "blockStateChanged", blockId, state: {} },
  });

  return { statusCode: 200, body: "OK" };
};
