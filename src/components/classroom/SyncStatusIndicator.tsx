'use client';

import type { WsStatus } from '@/hooks/useClassroomConnection';

const LABEL: Record<WsStatus, string> = {
  connecting: '接続中...',
  open: '同期中',
  closed: '切断されました',
};

const DOT_CLASS: Record<WsStatus, string> = {
  connecting: 'bg-amber-400',
  open: 'bg-emerald-500',
  closed: 'bg-red-500',
};

export default function SyncStatusIndicator({ status }: { status: WsStatus }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_CLASS[status]}`} />
      {LABEL[status]}
    </span>
  );
}
