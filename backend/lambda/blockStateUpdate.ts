import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { getManagementApiClient, broadcastToRoom, sendToConnection } from "./lib/broadcast";
import { isActiveHost } from "./lib/hostAuth";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME!;
const ROOM_SESSION_TABLE_NAME = process.env.ROOM_SESSION_TABLE_NAME!;

// 動的ブロックの実行時パラメータ更新。UIのdisabledはあくまで補助で、
// 実際に操作者かどうかの最終判定はここ(サーバ側)で行う。
export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");
  const { roomId, blockId, state } = body;

  if (!roomId || !blockId || state === undefined) {
    return { statusCode: 400, body: "roomId, blockId, state are required" };
  }

  const apigwClient = getManagementApiClient(event);

  const current = await docClient.send(new GetCommand({
    TableName: ROOM_SESSION_TABLE_NAME,
    Key: { roomId, sk: blockId },
  }));
  const item = current.Item as
    | { controllerRule?: "teacher-only" | "assigned"; controllerConnectionId?: string }
    | undefined;

  const allowed = item
    ? item.controllerRule === "teacher-only"
      ? await isActiveHost(docClient, ROOM_SESSION_TABLE_NAME, roomId, connectionId)
      : item.controllerConnectionId === connectionId
    : false;

  if (!allowed) {
    await sendToConnection(apigwClient, connectionId, {
      type: "blockStateRejected",
      blockId,
      reason: item ? "not-controller" : "not-shared",
    });
    return { statusCode: 403, body: "Forbidden" };
  }

  await docClient.send(new UpdateCommand({
    TableName: ROOM_SESSION_TABLE_NAME,
    Key: { roomId, sk: blockId },
    UpdateExpression: "SET #s = :state, updatedAt = :now",
    ExpressionAttributeNames: { "#s": "state" },
    ExpressionAttributeValues: { ":state": state, ":now": Date.now() },
  }));

  // 操作者自身の画面も、この値をそのまま真値として表示している(ローカルでは持たない)ため、
  // 送信者を除外せず全員に配信する。除外すると操作者本人の画面だけが更新されなくなる。
  await broadcastToRoom({
    docClient,
    connectionsTableName: CONNECTIONS_TABLE_NAME,
    apigwClient,
    roomId,
    payload: { type: "blockStateChanged", blockId, state },
  });

  return { statusCode: 200, body: "OK" };
};
