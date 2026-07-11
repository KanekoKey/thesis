/**
 * DynamoDB テーブル型定義
 *
 * テーブル定義: backend/lib/backend-stack.ts
 */

import type { SlideData } from './slide';

// ============================================
// DecksTable - デッキデータ保存用
// ============================================
// API: src/app/api/decks/[deckId]/route.ts

export type DeckItem = {
  roomId: string;        // パーティションキー（デッキID）
  slides: SlideData[];   // スライドデータ配列
  updatedAt?: string;    // 最終更新日時 (ISO8601)
};

// ============================================
// ConnectionsTable - WebSocket接続管理用
// ============================================
// Lambda: backend/lambda/connect.ts, disconnect.ts, joinRoom.ts, changeBlock.ts
// GSI: RoomIndex (roomId でクエリ可能)

export type ConnectionItem = {
  connectionId: string;  // パーティションキー（WebSocket接続ID）
  roomId?: string;       // 参加中の教室ID（joinRoom後に設定）
};
