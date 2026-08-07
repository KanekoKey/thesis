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
    // dynamoDB:  配信セッション管理用のテーブル(新規)
    // ==========================================
    // 配信を開始するたびに新しい roomId / hostToken を発行する。deckId(DecksTable)とは別物。
    const roomsTable = new dynamodb.Table(this, 'RoomsTable', {
      partitionKey: { name: 'roomId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    new cdk.CfnOutput(this, 'RoomsTableName', {
      value: roomsTable.tableName,
      description: 'DynamoDB Table Name for Rooms',
    });

    // ==========================================
    // dynamoDB:  授業ごとの実行時状態を保存するテーブル(新規)
    // ==========================================
    // SK = blockId: ブロックごとの実行時状態 / SK = "__room__": 部屋全体の状態(正規host接続IDなど)
    const roomSessionTable = new dynamodb.Table(this, 'RoomSessionTable', {
      partitionKey: { name: 'roomId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
      environment: {
        TABLE_NAME: connectionsTable.tableName,
        // host切断時のactiveHostConnectionIdクリア、controller切断時の操作権自動解放に使用
        ROOM_SESSION_TABLE_NAME: roomSessionTable.tableName,
      },
    });

    const joinRoomHandler = new lambda.NodejsFunction(this, 'JoinRoomHandler', {
      entry: 'lambda/joinRoom.ts',
      environment: {
        TABLE_NAME: connectionsTable.tableName,
        ROOMS_TABLE_NAME: roomsTable.tableName, // hostToken検証に使用
        ROOM_SESSION_TABLE_NAME: roomSessionTable.tableName, // テイクオーバー処理に使用
      },
    });

    const changeBlockHandler = new lambda.NodejsFunction(this, 'ChangeBlockHandler', {
      entry: 'lambda/changeBlock.ts',
      environment: { TABLE_NAME: connectionsTable.tableName },
    });

    // 動的ブロックの操作許可・同期まわりの新規Lambda群
    const permissionLambdaEnv = {
      CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
      ROOM_SESSION_TABLE_NAME: roomSessionTable.tableName,
    };
    const setBlockPermissionHandler = new lambda.NodejsFunction(this, 'SetBlockPermissionHandler', {
      entry: 'lambda/setBlockPermission.ts',
      environment: permissionLambdaEnv,
    });
    const blockStateUpdateHandler = new lambda.NodejsFunction(this, 'BlockStateUpdateHandler', {
      entry: 'lambda/blockStateUpdate.ts',
      environment: permissionLambdaEnv,
    });
    const assignControlHandler = new lambda.NodejsFunction(this, 'AssignControlHandler', {
      entry: 'lambda/assignControl.ts',
      environment: permissionLambdaEnv,
    });
    const revokeControlHandler = new lambda.NodejsFunction(this, 'RevokeControlHandler', {
      entry: 'lambda/revokeControl.ts',
      environment: permissionLambdaEnv,
    });
    const releaseControlHandler = new lambda.NodejsFunction(this, 'ReleaseControlHandler', {
      entry: 'lambda/releaseControl.ts',
      environment: permissionLambdaEnv,
    });
    const resetBlockStateHandler = new lambda.NodejsFunction(this, 'ResetBlockStateHandler', {
      entry: 'lambda/resetBlockState.ts',
      environment: permissionLambdaEnv,
    });
    const permissionHandlers = [
      setBlockPermissionHandler,
      blockStateUpdateHandler,
      assignControlHandler,
      revokeControlHandler,
      releaseControlHandler,
      resetBlockStateHandler,
    ];

    // テーブルへのアクセス権限付与
    connectionsTable.grantReadWriteData(connectHandler);
    connectionsTable.grantReadWriteData(disconnectHandler);
    connectionsTable.grantReadWriteData(joinRoomHandler);
    connectionsTable.grantReadData(changeBlockHandler);

    roomsTable.grantReadData(joinRoomHandler);
    roomSessionTable.grantReadWriteData(joinRoomHandler);
    roomSessionTable.grantReadWriteData(disconnectHandler);

    permissionHandlers.forEach((fn) => {
      connectionsTable.grantReadWriteData(fn); // ブロードキャスト先クエリ + 失効接続の削除
      roomSessionTable.grantReadWriteData(fn);
    });

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
    webSocketApi.addRoute('setBlockPermission', {
      integration: new WebSocketLambdaIntegration('SetBlockPermissionInteg', setBlockPermissionHandler),
    });
    webSocketApi.addRoute('blockStateUpdate', {
      integration: new WebSocketLambdaIntegration('BlockStateUpdateInteg', blockStateUpdateHandler),
    });
    webSocketApi.addRoute('assignControl', {
      integration: new WebSocketLambdaIntegration('AssignControlInteg', assignControlHandler),
    });
    webSocketApi.addRoute('revokeControl', {
      integration: new WebSocketLambdaIntegration('RevokeControlInteg', revokeControlHandler),
    });
    webSocketApi.addRoute('releaseControl', {
      integration: new WebSocketLambdaIntegration('ReleaseControlInteg', releaseControlHandler),
    });
    webSocketApi.addRoute('resetBlockState', {
      integration: new WebSocketLambdaIntegration('ResetBlockStateInteg', resetBlockStateHandler),
    });

    const stage = new apigwv2.WebSocketStage(this, 'ProdStage', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    // Lambdaが他のクライアントにメッセージを送るための権限を付与
    webSocketApi.grantManageConnections(changeBlockHandler);
    webSocketApi.grantManageConnections(joinRoomHandler); // joined / hostTakenOver 通知に使用
    webSocketApi.grantManageConnections(disconnectHandler); // controller自動解放の通知に使用
    permissionHandlers.forEach((fn) => webSocketApi.grantManageConnections(fn));
  }
}
