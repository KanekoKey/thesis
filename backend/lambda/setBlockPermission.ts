import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { getManagementApiClient, broadcastToRoom } from "./lib/broadcast";
import { isActiveHost } from "./lib/hostAuth";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME!;
const ROOM_SESSION_TABLE_NAME = process.env.ROOM_SESSION_TABLE_NAME!;

// 教員が動的ブロックの individual/shared・操作者決定ルールを変更する
export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");
  const { roomId, blockId, sync, controllerRule } = body;

  if (!roomId || !blockId || !sync) {
    return { statusCode: 400, body: "roomId, blockId, sync are required" };
  }

  if (!(await isActiveHost(docClient, ROOM_SESSION_TABLE_NAME, roomId, connectionId))) {
    return { statusCode: 403, body: "Forbidden" };
  }

  if (sync === "individual") {
    // individual のブロックは実行時状態を持たない
    await docClient.send(new DeleteCommand({
      TableName: ROOM_SESSION_TABLE_NAME,
      Key: { roomId, sk: blockId },
    }));
  } else {
    // 既存の state / controllerConnectionId は維持したまま、ルールだけ更新する
    await docClient.send(new UpdateCommand({
      TableName: ROOM_SESSION_TABLE_NAME,
      Key: { roomId, sk: blockId },
      UpdateExpression: "SET controllerRule = :rule, updatedAt = :now, #s = if_not_exists(#s, :empty)",
      ExpressionAttributeNames: { "#s": "state" },
      ExpressionAttributeValues: {
        ":rule": controllerRule ?? "teacher-only",
        ":now": Date.now(),
        ":empty": {},
      },
    }));
  }

  const apigwClient = getManagementApiClient(event);
  await broadcastToRoom({
    docClient,
    connectionsTableName: CONNECTIONS_TABLE_NAME,
    apigwClient,
    roomId,
    payload: { type: "blockPermissionChanged", blockId, sync, controllerRule },
  });

  return { statusCode: 200, body: "OK" };
};
