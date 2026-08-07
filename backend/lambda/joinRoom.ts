import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { getManagementApiClient, sendToConnection, broadcastRoster } from "./lib/broadcast";
import { getActiveHostConnectionId } from "./lib/hostAuth";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CONNECTIONS_TABLE_NAME = process.env.TABLE_NAME!;
const ROOMS_TABLE_NAME = process.env.ROOMS_TABLE_NAME!;
const ROOM_SESSION_TABLE_NAME = process.env.ROOM_SESSION_TABLE_NAME!;

// 接続を roomId に紐付ける。role: 'host' の自己申告は hostToken で裏付けが取れた場合のみ信用し、
// 取れなければ強制的に guest へ降格する(URLのパスを guest→host に書き換えるだけのなりすまし対策)。
export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");
  const { roomId, displayName, hostToken } = body;

  if (!roomId) {
    return { statusCode: 400, body: "roomId is required" };
  }

  let role: "host" | "guest" = body.role === "host" ? "host" : "guest";
  if (role === "host") {
    const room = await docClient.send(new GetCommand({
      TableName: ROOMS_TABLE_NAME,
      Key: { roomId },
    }));
    const validToken = !!hostToken && room.Item?.hostToken === hostToken;
    if (!validToken) {
      role = "guest";
    }
  }

  const names: Record<string, string> = { "#role": "role" };
  const values: Record<string, unknown> = { ":r": roomId, ":role": role, ":c": Date.now() };
  let updateExpr = "SET roomId = :r, #role = :role, connectedAt = :c";
  if (displayName) {
    updateExpr += ", displayName = :d";
    values[":d"] = displayName;
  }
  await docClient.send(new UpdateCommand({
    TableName: CONNECTIONS_TABLE_NAME,
    Key: { connectionId },
    UpdateExpression: updateExpr,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));

  const apigwClient = getManagementApiClient(event);

  if (role === "host") {
    // テイクオーバー: 直近に接続してきたhostToken保有者だけを正規hostとして扱う
    const previousHostConnectionId = await getActiveHostConnectionId(docClient, ROOM_SESSION_TABLE_NAME, roomId);

    await docClient.send(new UpdateCommand({
      TableName: ROOM_SESSION_TABLE_NAME,
      Key: { roomId, sk: "__room__" },
      UpdateExpression: "SET activeHostConnectionId = :c",
      ExpressionAttributeValues: { ":c": connectionId },
    }));

    if (previousHostConnectionId && previousHostConnectionId !== connectionId) {
      await sendToConnection(apigwClient, previousHostConnectionId, { type: "hostTakenOver" });
    }
  }

  // 途中参加/再接続でも今の状態が分かるよう、共有(shared)ブロックの現在値をスナップショットで渡す
  const sessionRows = await docClient.send(new QueryCommand({
    TableName: ROOM_SESSION_TABLE_NAME,
    KeyConditionExpression: "roomId = :r",
    ExpressionAttributeValues: { ":r": roomId },
  }));
  const blocks = (sessionRows.Items || [])
    .filter((item) => item.sk !== "__room__")
    .map((item) => ({
      blockId: item.sk,
      controllerRule: item.controllerRule,
      controllerConnectionId: item.controllerConnectionId ?? null,
      state: item.state,
    }));

  // クライアントへ、実際に確定した役割・自分のconnectionId・現在のブロック状態を通知する
  // (hostTokenが無効でguestに降格した場合もここで分かる)
  await sendToConnection(apigwClient, connectionId, { type: "joined", role, connectionId, blocks });

  // 参加者一覧を部屋の全員に配信する
  await broadcastRoster(docClient, CONNECTIONS_TABLE_NAME, apigwClient, roomId);

  return { statusCode: 200, body: "Joined room" };
};
