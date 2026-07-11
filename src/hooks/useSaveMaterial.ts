import { useEffect, useState } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export function useSaveMaterial(deckId: string) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // 保存結果の表示（success/error）を一定時間後に消す
  useEffect(() => {
    if (saveStatus !== 'success' && saveStatus !== 'error') return;
    const timer = setTimeout(() => setSaveStatus('idle'), 3000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  // --- 保存のハンドラー（DBへ保存） ---
  const handleSave = async () => {
    const slides = useEditorStore.getState().slides;

    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/materials/${deckId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides }),
      });
      if (!response.ok) throw new Error('保存に失敗しました');
      setLastSavedAt(new Date());
      setSaveStatus('success');
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  return { saveStatus, lastSavedAt, handleSave };
}
