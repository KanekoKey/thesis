import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ==========================================
    // dynamoDB:  WebSocket通信管理用のテーブル
    // ==========================================
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
    
    // ==========================================
    // dynamoDB:  デッキデータ保存用のテーブル
    // ==========================================
    const decksTable = new dynamodb.Table(this, 'DecksTable', {
      partitionKey: { name: 'roomId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    new cdk.CfnOutput(this, 'DecksTableName', {
      value: decksTable.tableName,
      description: 'DynamoDB Table Name for Decks',
    });

    // ==========================================
    //  Lambda関数
    // ==========================================
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

    // ==========================================
    //  API Gateway WebSocket API
    // ==========================================
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
