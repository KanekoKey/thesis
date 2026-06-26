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
                    onChange={(e) => {
                        const newShape = e.target.value as TrackShape;
                        updateBlockParams(blockId, { 
                            trackShape: newShape,
                            mass: 10,
                            gravity: 9.8,
                            initialHeight: newShape === 'loop' ? 0 : 50, // ループの時だけ0
                            peakHeight: 20,
                            initialVelocity: 0
                        });
                    }}
                    className="border border-gray-300 rounded p-1.5 text-sm bg-gray-50 outline-none focus:border-blue-500"
                >
                    <option value="drop">ドロップ</option>
                    <option value="camel-back">キャメルバック</option>
                    <option value="loop">ループ</option>
                </select>
            </div>

            {/* 質量 (kg) */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">質量 (kg)</label>
                <input
                    type="number"
                    min="0"
                    step="1"
                    value={params.mass}
                    onChange={(e) => updateBlockParams(blockId, { mass: Number(e.target.value) })}
                    className="border border-gray-300 rounded p-1.5 text-sm bg-gray-50 outline-none focus:border-blue-500"
                />
            </div>

            {/* 重力加速度 (m/s²) */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">重力加速度 (m/s²)</label>
                <input
                    type="number"
                    step="0.1"
                    value={params.gravity}
                    onChange={(e) => updateBlockParams(blockId, { gravity: Number(e.target.value) })}
                    className="border border-gray-300 rounded p-1.5 text-sm bg-gray-50 outline-none focus:border-blue-500"
                />
            </div>

            {/* スタートの高さ (m) */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">スタートの高さ (m)</label>
                <input
                    type="number"
                    min="0"
                    step="1"
                    value={params.trackShape === 'loop' ? 0 : params.initialHeight}
                    disabled={params.trackShape === 'loop'}
                    onChange={(e) => updateBlockParams(blockId, { initialHeight: Number(e.target.value) })}
                    className={`border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-blue-500 transition-colors ${
                        params.trackShape === 'loop' 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-50'
                    }`}
                />
            </div>

            {/* ループの高さ (m) */}
            {params.trackShape === 'loop' && (
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">ループの高さ (m)</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={params.peakHeight ?? 20}
                        onChange={(e) => updateBlockParams(blockId, { peakHeight: Number(e.target.value) })}
                    className="border border-gray-300 rounded p-1.5 text-sm bg-gray-50 outline-none focus:border-blue-500"
                    />
                </div>
            )}

            {/* スタートの速度 (m/s) */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">スタートの速度 (m/s)</label>
                <input
                    type="number"
                    min="0"
                    step="1"
                    value={params.initialVelocity}
                    onChange={(e) => updateBlockParams(blockId, { initialVelocity: Number(e.target.value) })}
                    className="border border-gray-300 rounded p-1.5 text-sm bg-gray-50 outline-none focus:border-blue-500"
                />
            </div>
        </div>
    );
}