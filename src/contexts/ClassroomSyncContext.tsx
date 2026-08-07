'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

export type BlockSyncInfo = {
  sync?: 'individual' | 'shared';
  controllerRule?: 'teacher-only' | 'assigned';
  controllerConnectionId?: string | null;
};

export type RosterEntry = {
  connectionId: string;
  role: 'host' | 'guest';
  displayName?: string;
};

export type ClassroomSyncContextValue = {
  myConnectionId: string | null;
  isHost: boolean;
  roster: RosterEntry[];
  blockSync: Record<string, BlockSyncInfo>;
  blockStates: Record<string, Record<string, unknown>>;
  send: (action: string, payload?: Record<string, unknown>) => void;
};

const ClassroomSyncContext = createContext<ClassroomSyncContextValue | null>(null);

export function ClassroomSyncProvider({
  myConnectionId,
  isHost,
  roster,
  blockSync,
  blockStates,
  send,
  children,
}: ClassroomSyncContextValue & { children: ReactNode }) {
  const value = useMemo(
    () => ({ myConnectionId, isHost, roster, blockSync, blockStates, send }),
    [myConnectionId, isHost, roster, blockSync, blockStates, send]
  );

  return (
    <ClassroomSyncContext.Provider value={value}>
      {children}
    </ClassroomSyncContext.Provider>
  );
}

// Provider の外(エディタのプレビュー等)では null を返す。
// 呼び出し側はこれを「同期の仕組みが存在しない = individualとして振る舞う」の合図として扱う。
export function useClassroomSync(): ClassroomSyncContextValue | null {
  return useContext(ClassroomSyncContext);
}
