import { useEditorStore } from '@/stores/useEditorStore';
import type { RollerCoasterBlockData } from '@/types/block';
import SelectField from '../InputFields/SelectField';
import NumberField from '../InputFields/NumberField';
import OverflowNotice from './OverflowNotice';

interface Props {
    blockId: string;
    params: RollerCoasterBlockData['parameters'];
}

export default function RollerCoasterBlockSettings({ blockId, params }: Props) {
    const updateBlockParams = useEditorStore(state => state.updateBlockParams);

    const update = (newParams: Partial<RollerCoasterBlockData['parameters']>) => {
        updateBlockParams(blockId, newParams);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* ブロックの必要な大きさはレイアウトで決まる(横並び/縦並びで下限が違う)ので、警告はここに出す */}
            <div className="flex flex-col gap-2">
                <SelectField
                    label="レイアウト"
                    value={params.layout || 'horizontal'}
                    options={[
                        { value: 'horizontal', label: '横並び' },
                        { value: 'vertical', label: '縦並び' },
                    ]}
                    onChange={(val) => update({ layout: val })}
                />
                <OverflowNotice blockId={blockId}>
                    レイアウトを変更してください
                </OverflowNotice>
            </div>

            <SelectField
                label="コース形状"
                value={params.trackShape || 'drop'}
                options={[
                    { value: 'drop', label: 'ドロップ' },
                    { value: 'camel-back', label: 'キャメルバック' },
                    { value: 'loop', label: 'ループ' }
                ]}
                onChange={(val) => {
                    update({ 
                        trackShape: val,
                        initialHeight: val === 'loop' ? 0 : 50,
                    });
                }}
            />

            <NumberField
                label="質量 (kg)"
                min={0}
                value={params.mass}
                onChange={(val) => update({ mass: val })}
            />

            <NumberField
                label="重力加速度 (m/s²)"
                step={0.1}
                value={params.gravity}
                onChange={(val) => update({ gravity: val })}
            />

            <NumberField
                label="スタートの高さ (m)"
                min={0}
                value={params.trackShape === 'loop' ? 0 : params.initialHeight}
                disabled={params.trackShape === 'loop'}
                onChange={(val) => update({ initialHeight: val })}
            />

            {params.trackShape === 'loop' && (
                <NumberField
                    label="ループの高さ (m)"
                    min={1}
                    value={params.peakHeight ?? 20}
                    onChange={(val) => update({ peakHeight: val })}
                />
            )}

            <NumberField
                label="スタートの速度 (m/s)"
                min={0}
                value={params.initialVelocity}
                onChange={(val) => update({ initialVelocity: val })}
            />
        </div>
    );
}