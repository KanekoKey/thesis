import { useEditorStore } from '@/stores/useEditorStore';
import type { TextBlockData } from '@/types/block';
import TextField from '../InputFields/TextField';
import OverflowNotice from './OverflowNotice';

interface Props {
    blockId: string;
    params: TextBlockData['parameters'];
}

export default function TextBlockSettings({ blockId, params }: Props) {
    const updateBlockParams = useEditorStore(state => state.updateBlockParams);

    return (
        <div className="flex flex-col gap-4">
            <TextField
                label="テキスト内容"
                placeholder="テキストを入力..."
                value={params.content}
                onChange={(val) => updateBlockParams(blockId, { content: val })}
            />
            <OverflowNotice blockId={blockId}>
                文字数を減らしてください
            </OverflowNotice>
        </div>
    );
}