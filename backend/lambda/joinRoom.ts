import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UpdateCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");
  const roomId = body.roomId;

  if (roomId) {
    // 接続情報に roomId を紐付ける
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { connectionId },
      UpdateExpression: "set roomId = :r",
      ExpressionAttributeValues: { ":r": roomId }
    }));
  }

  return { statusCode: 200, body: "Joined room" };
};