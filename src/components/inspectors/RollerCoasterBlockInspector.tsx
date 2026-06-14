import { useEditorStore } from '@/stores/useEditorStore';
import type { RollerCoasterBlockData } from '@/types/block';

interface Props {
    blockId: string;
    params: RollerCoasterBlockData['parameters'];
}

type TrackShape = RollerCoasterBlockData['parameters']['trackShape'];

export default function RollerCoasterBlockInspector({ blockId, params }: Props) {
    const updateBlockParams = useEditorStore(state => state.updateBlockParams);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">コース形状</label>
                <select
                    value={params.trackShape}
                    onChange={(e) => updateBlockParams(blockId, { trackShape: e.target.value as TrackShape })}
                    className="border border-gray-300 rounded p-1.5 text-sm bg-gray-50 outline-none focus:border-blue-500"
                >
                    <option value="drop">ドロップ</option>
                    <option value="camel-back">キャメルバック</option>
                    <option value="loop">ループ</option>
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">質量 (kg)</label>
                <input
                    type="number"
                    value={params.mass}
                    onChange={(e) => updateBlockParams(blockId, { mass: Number(e.target.value) })}
                    className="border border-gray-300 rounded p-1.5 text-sm bg-gray-50 outline-none focus:border-blue-500"
                />
            </div>
        </div>
    );
}