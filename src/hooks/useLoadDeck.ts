import { useEffect, useState } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';

// エディタ初期表示用: DBのデッキ内容をuseEditorStoreへ読み込む
export function useLoadDeck(deckId: string) {
  const setSlides = useEditorStore((state) => state.setSlides);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deckId) return;

    let cancelled = false;

    const fetchDeck = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/decks/${deckId}`);
        if (!response.ok) throw new Error('データの取得に失敗しました');

        const data = await response.json();
        if (!cancelled) setSlides(data.slides);

      } catch (err) {
        console.error(err);
        if (!cancelled) setError('デッキの読み込みエラーが発生しました');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchDeck();
    return () => { cancelled = true; };
  }, [deckId, setSlides]);

  return { isLoading, error };
}
