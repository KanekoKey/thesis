'use client';

import { useState } from 'react';
import { Lock, Users, UserCheck } from 'lucide-react';
import type { RosterEntry } from '@/contexts/ClassroomSyncContext';

export type PermissionMode =
  | { sync: 'individual' }
  | { sync: 'shared'; controllerRule: 'teacher-only' | 'assigned' };

interface Props {
  mode: PermissionMode;
  controllerConnectionId?: string | null;
  roster: RosterEntry[];
  onChangeMode: (mode: PermissionMode) => void;
  onAssign: (connectionId: string) => void;
  onRevoke: () => void;
}

function isSameMode(a: PermissionMode, b: PermissionMode) {
  if (a.sync !== b.sync) return false;
  if (a.sync === 'shared' && b.sync === 'shared') return a.controllerRule === b.controllerRule;
  return true;
}

function modeLabel(mode: PermissionMode) {
  if (mode.sync === 'individual') return '個別';
  return mode.controllerRule === 'teacher-only' ? '共有: 教員のみ' : '共有: 指名制';
}

const MODE_OPTIONS: { mode: PermissionMode; label: string; icon: typeof Lock }[] = [
  { mode: { sync: 'individual' }, label: '個別(各自ローカル)', icon: Users },
  { mode: { sync: 'shared', controllerRule: 'teacher-only' }, label: '共有: 教員のみ', icon: Lock },
  { mode: { sync: 'shared', controllerRule: 'assigned' }, label: '共有: 指名制', icon: UserCheck },
];

// 動的ブロックの右上に重ねる、教員専用の操作許可バッジ。
// クリックでポップオーバーを開き、individual/shared・操作者決定ルールを切り替える。
// controllerRule: 'assigned' のときはそのまま参加者一覧から指名先を選べる。
export default function BlockPermissionBadge({
  mode, controllerConnectionId, roster, onChangeMode, onAssign, onRevoke,
}: Props) {
  const [open, setOpen] = useState(false);
  const students = roster.filter((r) => r.role === 'guest');

  return (
    <div className="absolute -top-3 right-3 z-20">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm hover:bg-amber-600 transition"
      >
        {modeLabel(mode)}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onChangeMode(opt.mode)}
              className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 ${
                isSameMode(opt.mode, mode) ? 'text-amber-600 font-bold' : 'text-gray-700'
              }`}
            >
              <opt.icon className="w-3.5 h-3.5 shrink-0" />
              {opt.label}
            </button>
          ))}

          {mode.sync === 'shared' && mode.controllerRule === 'assigned' && (
            <div className="border-t border-gray-100 mt-1 pt-1">
              <p className="px-3 py-1 text-[11px] text-gray-400">指名する生徒を選択</p>
              {students.length === 0 && (
                <p className="px-3 py-1 text-xs text-gray-400">接続中の生徒がいません</p>
              )}
              {students.map((s) => {
                const active = s.connectionId === controllerConnectionId;
                return (
                  <button
                    key={s.connectionId}
                    onClick={() => onAssign(s.connectionId)}
                    className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 ${
                      active ? 'text-amber-600 font-bold' : 'text-gray-700'
                    }`}
                  >
                    {s.displayName ?? '(名称未設定)'} {active && '(指名中)'}
                  </button>
                );
              })}
              {controllerConnectionId && (
                <button
                  onClick={onRevoke}
                  className="w-full text-left px-3 py-1.5 text-red-500 hover:bg-red-50"
                >
                  指名を解除
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
