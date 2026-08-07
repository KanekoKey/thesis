import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { getManagementApiClient, broadcastToRoom } from "./lib/broadcast";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME!;
const ROOM_SESSION_TABLE_NAME = process.env.ROOM_SESSION_TABLE_NAME!;

// 生徒(または教員)が自分自身の操作権を自主的に返却する。
// 教員限定ではなく「今のcontroller本人か」だけをDynamoDBの条件式でチェックする。
export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");
  const { roomId, blockId } = body;

  if (!roomId || !blockId) {
    return { statusCode: 400, body: "roomId, blockId are required" };
  }

  try {
    await docClient.send(new UpdateCommand({
      TableName: ROOM_SESSION_TABLE_NAME,
      Key: { roomId, sk: blockId },
      ConditionExpression: "controllerConnectionId = :me",
      UpdateExpression: "REMOVE controllerConnectionId SET updatedAt = :now",
      ExpressionAttributeValues: { ":me": connectionId, ":now": Date.now() },
    }));
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ConditionalCheckFailedException") {
      // 自分がcontrollerでない場合は何もしない(不正操作でも実害はないため静かに無視)
      return { statusCode: 200, body: "Not the controller, ignored" };
    }
    throw error;
  }

  const apigwClient = getManagementApiClient(event);
  await broadcastToRoom({
    docClient,
    connectionsTableName: CONNECTIONS_TABLE_NAME,
    apigwClient,
    roomId,
    payload: { type: "blockPermissionChanged", blockId, controllerConnectionId: null },
  });

  return { statusCode: 200, body: "OK" };
};
