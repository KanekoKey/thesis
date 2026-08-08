import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { getManagementApiClient, broadcastToRoom } from "./lib/broadcast";
import { isActiveHost } from "./lib/hostAuth";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;
const ROOM_SESSION_TABLE_NAME = process.env.ROOM_SESSION_TABLE_NAME!;

// 表示中スライド番号の同期。送信元が正規hostかどうかをサーバ側で確認してから配信する
// (roleの自己申告ではなく、RoomSessionTableのactiveHostConnectionIdとの一致で判定)。
export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");
  const roomId = body.roomId;
  const activeIndex = body.activeIndex;

  if (!roomId) {
    return { statusCode: 400, body: "roomId is required" };
  }

  if (!(await isActiveHost(docClient, ROOM_SESSION_TABLE_NAME, roomId, connectionId))) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const apigwClient = getManagementApiClient(event);
  await broadcastToRoom({
    docClient,
    connectionsTableName: TABLE_NAME,
    apigwClient,
    roomId,
    payload: { activeIndex },
  });

  return { statusCode: 200, body: "Broadcast success" };
};
