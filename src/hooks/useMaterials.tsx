import { useState, useEffect } from 'react';
import type { BlockData } from '@/types/block';
export function useMaterials(roomId: string) {
  // 3つの状態（データ、ロード中か、エラーか）を管理する箱
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // データを取得する関数
    const fetchBlocks = async () => {
      try {
        setIsLoading(true);
        
        // API（バックエンド）に向かってデータを要求する
        const response = await fetch(`/api/classrooms/${roomId}`);
        
        // もしAPIから「見つかりません」などのエラーが返ってきたら強制終了
        if (!response.ok) throw new Error('データの取得に失敗しました');
        
        // 成功したらJSONを解読してblocksにセットする
        const data = await response.json();
        setBlocks(data.blocks);
        
      } catch (err) {
        console.error(err);
        setError('教材の読み込みエラーが発生しました');
      } finally {
        // 成功しても失敗しても、最後に必ずロード中状態を解除する
        setIsLoading(false);
      }
    };

    // roomId が存在している時だけ取得を実行する
    if (roomId) {
      fetchBlocks();
    }
  }, [roomId]);

  // 使う側の画面（UI）に、この3つの状態をセットで渡してあげる
  return { blocks, isLoading, error };
}