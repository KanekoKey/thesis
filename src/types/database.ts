/**
 * DynamoDB テーブル型定義
 *
 * テーブル定義: backend/lib/backend-stack.ts
 */

import type { SlideData } from './slide';
import type { BlockPermission } from './block';

// ============================================
// DecksTable - デッキ（教材）データ保存用
// ============================================
// API: src/app/api/decks/[deckId]/route.ts
// 注意: パーティションキーの実体は歴史的経緯で `roomId` という属性名のままだが、
// 意味は「デッキ自身のID」であり、下記 RoomItem の roomId（配信セッションID）とは別物。

export type DeckItem = {
  roomId: string;        // パーティションキー（デッキID。実質 deckId）
  slides: SlideData[];   // スライドデータ配列
  updatedAt?: string;    // 最終更新日時 (ISO8601)
};

// ============================================
// RoomsTable - 配信セッション管理用（新規）
// ============================================
// API: src/app/api/rooms/route.ts, src/app/api/rooms/[roomId]/route.ts
// 教員がエディタで「配信を開始」するたびに新しい roomId / hostToken を発行する。
// deckId（DecksTable.roomId）とは別IDにすることで、配信リンクの使い回しを防ぐ。

export type RoomItem = {
  roomId: string;    // パーティションキー（配信セッションID）
  deckId: string;    // 配信している教材のID（= DecksTable.roomId）
  hostToken: string; // このセッション限りの教員専用の秘密値
  createdAt: number; // 作成日時（UNIXミリ秒）
};

// ============================================
// RoomSessionTable - 授業ごとの実行時状態（新規）
// ============================================
// Lambda: backend/lambda/setBlockPermission.ts, blockStateUpdate.ts,
//         assignControl.ts, revokeControl.ts, resetBlockState.ts
// PK: roomId / SK: sk（値は blockId、または部屋全体の状態を表す予約値 "__room__"）

export type RoomSessionBlockItem = {
  roomId: string;
  sk: string; // = blockId
  state: Record<string, unknown>;                       // 例: { positionX: 0.42 }
  controllerRule: NonNullable<BlockPermission['controllerRule']>;
  controllerConnectionId?: string;
  updatedAt: number;
};

export type RoomSessionRoomItem = {
  roomId: string;
  sk: '__room__';
  activeHostConnectionId?: string; // 現在の正規host接続。テイクオーバーのたびに上書き
};

export type RoomSessionItem = RoomSessionBlockItem | RoomSessionRoomItem;

// ============================================
// ConnectionsTable - WebSocket接続管理用
// ============================================
// Lambda: backend/lambda/connect.ts, disconnect.ts, joinRoom.ts, changeBlock.ts
// GSI: RoomIndex (roomId でクエリ可能)

export type ConnectionItem = {
  connectionId: string;   // パーティションキー（WebSocket接続ID）
  roomId?: string;        // 参加中の教室ID（joinRoom後に設定）
  role?: 'host' | 'guest'; // 表示用途のみ。権限判定には使わない（判定はactiveHostConnectionIdとの一致で行う）
  displayName?: string;   // 参加時に生徒が入力する表示名（本人確認なし）
  connectedAt?: number;   // 接続日時（UNIXミリ秒）
};
