import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { getManagementApiClient, broadcastToRoom, broadcastRoster } from "./lib/broadcast";
import { getActiveHostConnectionId, nameClaimSk } from "./lib/hostAuth";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CONNECTIONS_TABLE_NAME = process.env.TABLE_NAME!;
const ROOM_SESSION_TABLE_NAME = process.env.ROOM_SESSION_TABLE_NAME!;

export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const connectionId = event.requestContext.connectionId;

  // 削除と同時に、切断前の roomId を取得する(削除後では roomId が分からなくなるため)
  const deleted = await docClient.send(new DeleteCommand({
    TableName: CONNECTIONS_TABLE_NAME,
    Key: { connectionId },
    ReturnValues: "ALL_OLD",
  }));
  const roomId = deleted.Attributes?.roomId as string | undefined;
  const displayName = deleted.Attributes?.displayName as string | undefined;

  if (!roomId) {
    return { statusCode: 200, body: "Disconnected" };
  }

  const apigwClient = getManagementApiClient(event);

  // 表示名の予約を解放する(再入室・他の生徒が同じ名前を使えるようにする)
  if (displayName) {
    await docClient.send(new DeleteCommand({
      TableName: ROOM_SESSION_TABLE_NAME,
      Key: { roomId, sk: nameClaimSk(displayName) },
    }));
  }

  // hostが切断した場合は「正規host不在」の状態に戻す
  const activeHostConnectionId = await getActiveHostConnectionId(docClient, ROOM_SESSION_TABLE_NAME, roomId);
  if (activeHostConnectionId === connectionId) {
    await docClient.send(new UpdateCommand({
      TableName: ROOM_SESSION_TABLE_NAME,
      Key: { roomId, sk: "__room__" },
      UpdateExpression: "REMOVE activeHostConnectionId",
    }));
  }

  // このconnectionIdが操作権を持ったまま切断したブロックがあれば、教員が気づかなくても自動的に解放する
  const sessionRows = await docClient.send(new QueryCommand({
    TableName: ROOM_SESSION_TABLE_NAME,
    KeyConditionExpression: "roomId = :r",
    ExpressionAttributeValues: { ":r": roomId },
  }));
  const controlledBlocks = (sessionRows.Items || []).filter(
    (item) => item.controllerConnectionId === connectionId
  );

  if (controlledBlocks.length > 0) {
    await Promise.all(controlledBlocks.map(async (item) => {
      await docClient.send(new UpdateCommand({
        TableName: ROOM_SESSION_TABLE_NAME,
        Key: { roomId, sk: item.sk },
        UpdateExpression: "REMOVE controllerConnectionId SET updatedAt = :now",
        ExpressionAttributeValues: { ":now": Date.now() },
      }));
      await broadcastToRoom({
        docClient,
        connectionsTableName: CONNECTIONS_TABLE_NAME,
        apigwClient,
        roomId,
        payload: { type: "blockPermissionChanged", blockId: item.sk, controllerConnectionId: null },
      });
    }));
  }

  // 参加者一覧を残りの全員に配信する
  await broadcastRoster(docClient, CONNECTIONS_TABLE_NAME, apigwClient, roomId);

  return { statusCode: 200, body: "Disconnected" };
};
