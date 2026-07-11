import { useState, useEffect } from 'react';
import type { SlideData } from '@/types/slide';

export function useDeck(deckId: string) {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/decks/${deckId}`);
        if (!response.ok) throw new Error('データの取得に失敗しました');

        const data = await response.json();
        setSlides(data.slides);

      } catch (err) {
        console.error(err);
        setError('デッキの読み込みエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (deckId) {
      fetchDeck();
    }
  }, [deckId]);

  return { slides, isLoading, error };
}
