import { useEditorStore } from '@/stores/useEditorStore';
import type { TextBlockData } from '@/types/block';

interface Props {
    blockId: string;
    params: TextBlockData['parameters'];
}

export default function TextInspector({ blockId, params }: Props) {
    const updateBlockParams = useEditorStore(state => state.updateBlockParams);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">テキスト内容</label>
                <textarea
                    value={params.content}
                    onChange={(e) => updateBlockParams(blockId, { content: e.target.value })}
                    className="border border-gray-300 rounded p-1.5 text-sm bg-gray-50 outline-none focus:border-blue-500 min-h-[100px]"
                    placeholder="テキストを入力..."
                />
            </div>
        </div>
    );
}