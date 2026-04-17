import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const connectionId = event.requestContext.connectionId;

  // 接続IDをDynamoDBに保存
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: { connectionId: connectionId }
  }));

  return { statusCode: 200, body: "Connected" };
};