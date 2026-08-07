import { useState } from 'react';

export type BroadcastStatus = 'idle' | 'starting' | 'error';

// 「配信を開始」ボタンから呼ぶ。押すたびに新しい roomId / hostToken を発行し、
// host用URLを新しいタブで開く。
export function useStartBroadcast(deckId: string) {
  const [status, setStatus] = useState<BroadcastStatus>('idle');

  const startBroadcast = async () => {
    setStatus('starting');
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId }),
      });
      if (!response.ok) throw new Error('配信の開始に失敗しました');

      const { roomId, hostToken } = await response.json();
      window.open(`/classroom/${roomId}/host?token=${hostToken}`, '_blank');
      setStatus('idle');

    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return { status, startBroadcast };
}
