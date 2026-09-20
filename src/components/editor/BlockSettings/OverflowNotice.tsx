import { TriangleAlert } from 'lucide-react';

import { useEditorStore } from '@/stores/useEditorStore';

interface Props {
    blockId: string;
    // 何を直せば収まるか(項目ごとの対処。ブロックを大きくする案内はここで付ける)
    children: React.ReactNode;
}

// ブロックの内容が枠に収まらず切れている間だけ、該当の設定項目の下に出す警告文
export default function OverflowNotice({ blockId, children }: Props) {
    const overflowing = useEditorStore((state) => blockId in state.overflowBlockIds);
    if (!overflowing) return null;

    return (
        <p role="alert" className="flex items-start gap-1.5 rounded bg-red-50 px-2 py-1.5 text-xs text-red-600">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{children}</span>
        </p>
    );
}
