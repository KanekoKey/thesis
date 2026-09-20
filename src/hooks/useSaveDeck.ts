import { useEffect, useState } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { findOverflowingBlockIds } from '@/lib/slideOverflow';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export function useSaveDeck(deckId: string) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  // saveStatus が 'error' のときに表示する理由
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (saveStatus !== 'success' && saveStatus !== 'error') return;
    // エラーは文が長いので、成功より少し長く見せる
    const timer = setTimeout(() => setSaveStatus('idle'), saveStatus === 'error' ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const handleSave = async () => {
    const { slides, setActiveSlideId, setSelectedBlockId } = useEditorStore.getState();

    // 内容がはみ出して切れているブロックがあるスライドは、教材として提示すると一部が見えないため保存させない。
    // 全スライドを調べ、最初の該当ブロックを選択して、ブロック設定パネルの警告文で直す箇所が分かるようにする
    const overflowing = slides
      .map((slide, index) => ({ slide, number: index + 1, blockIds: findOverflowingBlockIds(slide.blocks) }))
      .filter((entry) => entry.blockIds.length > 0);
    if (overflowing.length > 0) {
      setActiveSlideId(overflowing[0].slide.id);
      setSelectedBlockId(overflowing[0].blockIds[0]);
      setErrorMessage(`エラーのブロックがあるため保存できません(スライド ${overflowing.map((entry) => entry.number).join('・')})`);
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides }),
      });
      if (!response.ok) throw new Error('保存に失敗しました');
      setLastSavedAt(new Date());
      setSaveStatus('success');
    } catch (err) {
      console.error(err);
      setErrorMessage('保存に失敗しました');
      setSaveStatus('error');
    }
  };

  return { saveStatus, errorMessage, lastSavedAt, handleSave };
}
