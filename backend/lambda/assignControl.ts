import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { getManagementApiClient, broadcastToRoom } from "./lib/broadcast";
import { isActiveHost } from "./lib/hostAuth";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME!;
const ROOM_SESSION_TABLE_NAME = process.env.ROOM_SESSION_TABLE_NAME!;

// 教員がロスターパネルから特定の生徒を指名し、その生徒をブロックのcontrollerにする
export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const hostConnectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");
  const { roomId, blockId, connectionId: targetConnectionId } = body;

  if (!roomId || !blockId || !targetConnectionId) {
    return { statusCode: 400, body: "roomId, blockId, connectionId are required" };
  }

  if (!(await isActiveHost(docClient, ROOM_SESSION_TABLE_NAME, roomId, hostConnectionId))) {
    return { statusCode: 403, body: "Forbidden" };
  }

  try {
    await docClient.send(new UpdateCommand({
      TableName: ROOM_SESSION_TABLE_NAME,
      Key: { roomId, sk: blockId },
      // 先に setBlockPermission で sync: 'shared' になっている行にのみ指名できる
      ConditionExpression: "attribute_exists(roomId)",
      UpdateExpression: "SET controllerConnectionId = :c, updatedAt = :now",
      ExpressionAttributeValues: { ":c": targetConnectionId, ":now": Date.now() },
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
    payload: { type: "blockPermissionChanged", blockId, controllerConnectionId: targetConnectionId },
  });

  return { statusCode: 200, body: "OK" };
};
