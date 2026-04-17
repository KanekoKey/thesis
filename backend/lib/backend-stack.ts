import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigwv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. DynamoDB: 接続IDと所属ルームを管理
    const connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発用。本番ではRETAIN推奨
    });
    // roomId を使って Query検索できるようにする
    connectionsTable.addGlobalSecondaryIndex({
      indexName: 'RoomIndex', // Lambdaコード内の INDEX_NAME と一致させる
      partitionKey: { name: 'roomId', type: dynamodb.AttributeType.STRING },
      // projectionType: dynamodb.ProjectionType.ALL, // 必要に応じて（デフォルトはALL）
    });

    // 2. Lambda関数（Node.js + TypeScript）
    const connectHandler = new lambda.NodejsFunction(this, 'ConnectHandler', {
      entry: 'lambda/connect.ts',
      environment: { TABLE_NAME: connectionsTable.tableName },
    });

    const disconnectHandler = new lambda.NodejsFunction(this, 'DisconnectHandler', {
      entry: 'lambda/disconnect.ts',
      environment: { TABLE_NAME: connectionsTable.tableName },
    });
    
    const joinRoomHandler = new lambda.NodejsFunction(this, 'JoinRoomHandler', {
      entry: 'lambda/joinRoom.ts',
      environment: { TABLE_NAME: connectionsTable.tableName },
    });

    const changeBlockHandler = new lambda.NodejsFunction(this, 'ChangeBlockHandler', {
      entry: 'lambda/changeBlock.ts',
      environment: { TABLE_NAME: connectionsTable.tableName },
    });

    // テーブルへのアクセス権限付与
    connectionsTable.grantReadWriteData(connectHandler);
    connectionsTable.grantReadWriteData(disconnectHandler);
    connectionsTable.grantReadWriteData(joinRoomHandler);
    connectionsTable.grantReadData(changeBlockHandler);

    // 3. API Gateway WebSocket API
    const webSocketApi = new apigwv2.WebSocketApi(this, 'ThesisWebSocketApi', {
      // メッセージ内の "action" キーを見てルーティングを決定する設定
      routeSelectionExpression: '$request.body.action',
    });

    // 各ルートの追加
    webSocketApi.addRoute('$connect', {
      integration: new WebSocketLambdaIntegration('ConnectInteg', connectHandler),
    });
    webSocketApi.addRoute('$disconnect', {
      integration: new WebSocketLambdaIntegration('DisconnectInteg', disconnectHandler),
    });webSocketApi.addRoute('joinRoom', {
      integration: new WebSocketLambdaIntegration('JoinRoomInteg', joinRoomHandler),
    });
    webSocketApi.addRoute('changeBlock', {
      integration: new WebSocketLambdaIntegration('ChangeBlockInteg', changeBlockHandler),
    });

    const stage = new apigwv2.WebSocketStage(this, 'ProdStage', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    // Lambdaが他のクライアントにメッセージを送るための権限を付与
    webSocketApi.grantManageConnections(changeBlockHandler);
  }
}
