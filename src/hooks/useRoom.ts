import { useState, useEffect } from 'react';

// roomId(配信セッションID)から、配信している教材の deckId を解決する
export function useRoom(roomId: string) {
  const [deckId, setDeckId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/rooms/${roomId}`);
        if (!response.ok) throw new Error('配信セッションが見つかりません');

        const data = await response.json();
        setDeckId(data.deckId);

      } catch (err) {
        console.error(err);
        setError('配信セッションの読み込みエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  return { deckId, isLoading, error };
}
