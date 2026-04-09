// ブロックの種類を定義（Notionのように拡張しやすくします）
export type BlockType = 'h1' | 'h2' | 'paragraph' | 'image' | 'code';

// 教材を構成する最小単位（1行、または1つの画像）
export type Block = {
  id: string;        // ブロック固有のID
  type: BlockType;   // 見出し、本文、画像など
  content: string;   // テキストの中身や画像のURL
};

// ルーム（授業）の情報
export type Room = {
  id: string;
  title: string;
  teacherId: string;
  activeBlockId: string | null; // ★教員がいま注目させているブロックのID
  blocks: Block[];              // 教材データの配列
};