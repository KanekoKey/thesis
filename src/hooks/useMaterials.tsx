import { useState, useEffect } from 'react';
import type { SlideData } from '@/types/slide';

export function useMaterials(materialId: string) {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/materials/${materialId}`);
        if (!response.ok) throw new Error('データの取得に失敗しました');

        const data = await response.json();
        setSlides(data.slides);

      } catch (err) {
        console.error(err);
        setError('教材の読み込みエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (materialId) {
      fetchMaterials();
    }
  }, [materialId]);

  return { slides, isLoading, error };
}