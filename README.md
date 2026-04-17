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
npm run dev
```
デプロイ（確認用）
```bash
npm run build
```

### -- 4. フォルダ構成
主なファイルの構成を以下に示す

```bash
thesis/
├── backend/                    # 【バックエンド (AWS CDK)】
│   ├── bin/
│   ├── lib/                    # インフラ構成定義 (Stack)
│   ├── lambda/                 # リアルタイム通信の処理 (TypeScript)
│   └── cdk.json                # CDK設定ファイル
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/             #【共通機能】
│   │   │   ├── login/          # SCR-C01: ログイン画面
│   │   │   └── register/       # SCR-C02: 新規登録画面
│   │   ├── student/            # 【生徒用】
│   │   │   ├── dashboard/      # SCR-C04: 生徒ホーム画面
│   │   │   └── class/
│   │   │       └── [classId]/  # SCR-P03: 受講画面
│   │   ├── teacher/            # 【教員用】
│   │   │   ├── dashboard/      # SCR-C03: 教員ホーム画面
│   │   │   ├── editor/         # SCR-E01: 教材作成画面
│   │   │   └── class/          # SCR-P01: ルーム管理画面
│   │   │       └── [classId]/  # SCR-P02: 授業実施画面
│   │   └── layout.tsx
│   │   └── page.tsx            # Next.jsデフォルトホームページ
│   │                           # (後でログイン画面へのリダイレクトに修正)
│   └── components/
│       └── ui/                 # ボタン、入力欄などの最小パーツ
├── .gitignore
└── README.md
```

### -- 5. ブランチ名規則  
* **feat/** : 機能追加  
* **fix/** : バグ修正  
* **chore/** : 整備・改善  
* **docs/** : ドキュメント関係  
