import { useEditorStore } from '@/stores/useEditorStore';
import type { TwoColumnBlockData } from '@/types/block';
import { MIN_RATIO, MAX_RATIO } from '@/components/blocks/TwoColumnBlock';

interface Props {
    blockId: string;
    params: TwoColumnBlockData['parameters'];
}

export default function TwoColumnBlockSettings({ blockId, params }: Props) {
    const updateBlockParams = useEditorStore(state => state.updateBlockParams);

    const leftPercent = Math.round(params.ratio * 100);
    const rightPercent = 100 - leftPercent;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs text-gray-500">
                <span>左右の幅</span>
                <span>{leftPercent}% : {rightPercent}%</span>
            </div>
            <input
                type="range"
                min={MIN_RATIO}
                max={MAX_RATIO}
                step={0.01}
                value={params.ratio}
                onChange={(e) => updateBlockParams(blockId, { ratio: Number(e.target.value) })}
                className="w-full accent-blue-500"
            />
        </div>
    );
}
