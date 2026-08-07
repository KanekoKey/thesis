import { useEffect, useRef, useState, useCallback } from 'react';
import type { BlockSyncInfo, RosterEntry } from '@/contexts/ClassroomSyncContext';

const WS_URL = 'wss://0ydmcdhzc8.execute-api.ap-northeast-1.amazonaws.com/prod/';

export type WsStatus = 'connecting' | 'open' | 'closed';

type Options = {
  roomId: string;
  role: 'host' | 'guest';
  hostToken?: string | null;
  displayName?: string | null;
  // guestはニックネーム確定まで、hostはtoken解決まで接続を遅らせるためのフラグ
  enabled: boolean;
};

// classroom(host/guest)共通のWebSocket接続・状態管理をまとめたフック。
// スライド番号(activeIndex)に加えて、動的ブロックの権限・実行時状態・参加者一覧を保持する。
export function useClassroomConnection({ roomId, role, hostToken, displayName, enabled }: Options) {
  const wsRef = useRef<WebSocket | null>(null);

  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');
  const [activeIndex, setActiveIndex] = useState(0);
  const [myConnectionId, setMyConnectionId] = useState<string | null>(null);
  const [resolvedRole, setResolvedRole] = useState<'host' | 'guest' | null>(null);
  const [isTakenOver, setIsTakenOver] = useState(false);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [blockSync, setBlockSync] = useState<Record<string, BlockSyncInfo>>({});
  const [blockStates, setBlockStates] = useState<Record<string, Record<string, unknown>>>({});

  useEffect(() => {
    if (!enabled) return;

    setWsStatus('connecting');
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setWsStatus('open');
      ws.send(JSON.stringify({
        action: 'joinRoom',
        roomId,
        role,
        ...(hostToken ? { hostToken } : {}),
        ...(displayName ? { displayName } : {}),
      }));
    };

    ws.onclose = () => setWsStatus('closed');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // 既存のスライド番号同期(changeBlockの配信結果)には type が無い
      if (typeof data.activeIndex === 'number') {
        setActiveIndex(data.activeIndex);
        return;
      }

      switch (data.type) {
        case 'joined': {
          setMyConnectionId(data.connectionId ?? null);
          setResolvedRole(data.role ?? null);
          // 途中参加/再接続時、共有ブロックの現在値をスナップショットで受け取る
          const blocks = (data.blocks ?? []) as Array<{
            blockId: string;
            controllerRule?: 'teacher-only' | 'assigned';
            controllerConnectionId?: string | null;
            state?: Record<string, unknown>;
          }>;
          if (blocks.length > 0) {
            setBlockSync((prev) => {
              const next = { ...prev };
              for (const b of blocks) {
                next[b.blockId] = {
                  sync: 'shared',
                  controllerRule: b.controllerRule,
                  controllerConnectionId: b.controllerConnectionId ?? null,
                };
              }
              return next;
            });
            setBlockStates((prev) => {
              const next = { ...prev };
              for (const b of blocks) {
                next[b.blockId] = b.state ?? {};
              }
              return next;
            });
          }
          break;
        }
        case 'hostTakenOver':
          setIsTakenOver(true);
          break;
        case 'rosterUpdate':
          setRoster(data.participants ?? []);
          break;
        case 'blockPermissionChanged': {
          const { blockId, sync, controllerRule, controllerConnectionId } = data;
          setBlockSync((prev) => ({
            ...prev,
            [blockId]: {
              ...prev[blockId],
              ...(sync !== undefined ? { sync } : {}),
              ...(controllerRule !== undefined ? { controllerRule } : {}),
              ...(controllerConnectionId !== undefined ? { controllerConnectionId } : {}),
            },
          }));
          break;
        }
        case 'blockStateChanged':
          setBlockStates((prev) => ({ ...prev, [data.blockId]: data.state }));
          break;
        case 'blockStateRejected':
          console.warn('[classroom] operation rejected:', data);
          break;
      }
    };

    wsRef.current = ws;
    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, role, hostToken, displayName, enabled]);

  const send = useCallback((action: string, payload: Record<string, unknown> = {}) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action, roomId, ...payload }));
    }
  }, [roomId]);

  return {
    wsStatus,
    activeIndex,
    myConnectionId,
    resolvedRole,
    isTakenOver,
    roster,
    blockSync,
    blockStates,
    send,
  };
}
