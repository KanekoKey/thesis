import { useState, useEffect } from 'react';
import type { SlideData } from '@/types/slide';
export function useMaterials(roomId: string) {
  // 3つの状態（データ、ロード中か、エラーか）を管理する箱
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        // データを取得する前にロード中フラグを立てる
        setIsLoading(true);
        
        // APIルートにroomIdを渡して教材データを取得する
        const response = await fetch(`/api/classrooms/${roomId}`);
        if (!response.ok) throw new Error('データの取得に失敗しました');
        
        // APIからのレスポンスをJSONとしてパースする
        const data = await response.json();
        console.log('APIから届いたデータ:', data);
        setSlides(data.slides);
        
      } catch (err) {
        // エラーが発生した場合はエラーメッセージをセット
        console.error(err);
        setError('教材の読み込みエラーが発生しました');
      } finally {
        // ロードが終わったらロード中フラグを下げる
        setIsLoading(false);
      }
    };

    // roomId が存在している時だけ取得を実行する
    if (roomId) {
      fetchMaterials();
    }
  }, [roomId]);

  // 使う側の画面（UI）に、この3つの状態をセットで渡してあげる
  return { slides, isLoading, error };
}