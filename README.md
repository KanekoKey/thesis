# thesis


## ■ 開発ガイド
### -- 1. 開発バージョン
* **Node.js：** `24.11.1`
* **npm：** `11.6.2`

### -- 2. サーバー起動
```bash
cd my-thesis-app
npm run dev
```

### -- 3. フォルダ構成
主なファイルの構成を以下に示す

```bash
thesis/
├── README.md                          // プロジェクトの概要と開発ガイド
├── .gitignore                     // Gitで無視するファイルのリスト
├── .next/                         // Next.jsのビルド出力ディレクトリ（自動生成）
├── app/                           // Next.js App Routerのページとレイアウト
│   ├── favicon.ico                // ブラウザのファビコン
│   ├── globals.css                // グローバルCSSスタイル
│   ├── layout.tsx                 // 全ページ共通のレイアウトコンポーネント
│   └── page.tsx                   // トップページ (/ のルートページ)
├── eslint.config.mjs              // ESLintの設定ファイル
├── next-env.d.ts                  // Next.jsのTypeScript型定義
├── next.config.ts                 // Next.jsの設定ファイル
├── node_modules/                  // npmパッケージのインストールディレクトリ
├── package-lock.json              // npmの依存関係ロックファイル
├── package.json                   // npmの設定と依存関係定義
├── postcss.config.mjs             // PostCSSの設定ファイル
├── public/                        // 静的ファイル（画像、アイコンなど）
│   ├── file.svg                   // 汎用ファイルアイコン
│   ├── globe.svg                  // 地球アイコン
│   ├── next.svg                   // Next.jsロゴ
│   ├── vercel.svg                 // Vercelロゴ
│   └── window.svg                 // ウィンドウアイコン
└── tsconfig.json                  // TypeScriptの設定ファイル
```

### -- 4. ブランチ名規則  
* **feat/** : 機能追加  
* **fix/** : バグ修正  
* **chore/** : 整備・改善  
* **docs/** : ドキュメント関係  
