'use client';

import { Users } from 'lucide-react';
import type { RosterEntry } from '@/contexts/ClassroomSyncContext';

// 接続中の参加者一覧(教員側の情報パネル)。指名操作自体は各ブロックの
// BlockPermissionBadge から行うため、ここでは「誰が繋がっているか」の可視化に徹する。
export default function ParticipantRosterPanel({ roster }: { roster: RosterEntry[] }) {
  const students = roster.filter((r) => r.role === 'guest');

  return (
    <aside className="w-56 shrink-0 border-l border-gray-200 bg-white p-4 flex flex-col gap-3 overflow-y-auto">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-mono uppercase tracking-wide">
        <Users className="w-3.5 h-3.5" />
        参加者 {students.length}
      </div>

      {students.length === 0 && (
        <p className="text-xs text-gray-400">まだ生徒が接続していません</p>
      )}

      <ul className="flex flex-col gap-1.5">
        {students.map((s) => (
          <li
            key={s.connectionId}
            className="flex items-center gap-2 text-sm text-gray-700 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-100"
          >
            <span className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-mono text-gray-400 shrink-0">
              {(s.displayName ?? '?').slice(0, 1)}
            </span>
            <span className="truncate">{s.displayName ?? '(名称未設定)'}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
