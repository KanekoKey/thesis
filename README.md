# thesis

## ■ URL
https://main.d1453grp7m6b7i.amplifyapp.com/

## ■ 開発ガイド
### -- 1. 開発バージョン
* **Node.js：** `24.11.1`
* **npm：** `11.6.2`

### -- 2. バックエンド開発方法
準備
```bash
cd backend
npm install
```
初回セットアップ（※新しいAWS環境で初めてデプロイする場合のみ）
```bash
npx cdk bootstrap
```
デプロイ
```bash
npx cdk deploy
```

### -- 3. サーバー起動（フロントエンド）
```bash
npm install
npm run dev
```
デプロイ（確認用）
```bash
npm run build
```

### -- 4. ブランチ名規則  
* **feat/** : 機能追加  
* **fix/** : バグ修正  
* **chore/** : 整備・改善  
* **docs/** : ドキュメント関係  
