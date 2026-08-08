'use client';

import { useState, useEffect } from 'react';
import type { RollerCoasterBlockData, RollerCoasterLayout, BlockPermission } from '@/types/block';
import { useClassroomSync } from '@/contexts/ClassroomSyncContext';
import BlockPermissionBadge, { type PermissionMode } from '@/components/classroom/BlockPermissionBadge';

// これ未満の幅ではシミュレーション/数値パネルのレイアウトが崩れるため、
// two-column内などで下回る場合は横スクロールさせる（TwoColumnBlockが参照）
// horizontal(横並び)はシミュレーションと数値データが横に並ぶ分、vertical(縦並び)より広い幅が必要
export const ROLLER_COASTER_MIN_WIDTH: Record<RollerCoasterLayout, number> = {
    horizontal: 500,
    vertical:   300,
};

// --- RollerCoasterBlock｜型定義 ---
export const defaultRollerCoasterParams: Required<RollerCoasterBlockData['parameters']> = {
    layout: 'horizontal',
    trackShape: 'drop',
    mass: 10,
    gravity: 9.8,
    initialHeight: 50,
    peakHeight: 20,
    initialVelocity: 0,
};

type RollerCoasterBlockProps = RollerCoasterBlockData['parameters'] & {
    id: string;
    permission?: BlockPermission;
    interactive?: boolean;
};

// --- RollerCoasterBlock | コンポーネント ---
export default function RollerCoasterBlock({
    id,
    layout = defaultRollerCoasterParams.layout,
    trackShape = defaultRollerCoasterParams.trackShape,
    mass = defaultRollerCoasterParams.mass,
    gravity = defaultRollerCoasterParams.gravity,
    initialHeight = defaultRollerCoasterParams.initialHeight,
    peakHeight = defaultRollerCoasterParams.peakHeight,
    initialVelocity = defaultRollerCoasterParams.initialVelocity,
    permission,
    interactive = true,
}: RollerCoasterBlockProps) {
    const isInvalidHeight = trackShape === 'loop' ? initialHeight < 0 : initialHeight <= 0;
    const isInvalidPeakHeight = trackShape === 'loop' && peakHeight <= 0;

    // --- RollerCoasterBlock｜操作許可・同期 ---
    // Providerの外(エディタのプレビュー等)ではsyncがnullになり、常にindividual(ローカル完結)として振る舞う
    const sync = useClassroomSync();
    const live = sync?.blockSync[id];
    const effectiveSync = live?.sync ?? permission?.sync ?? 'individual';
    const effectiveControllerRule = live?.controllerRule ?? permission?.controllerRule ?? 'teacher-only';
    const controllerConnectionId = live?.controllerConnectionId ?? null;
    const isShared = sync !== null && effectiveSync === 'shared';

    const isController = isShared && (
        effectiveControllerRule === 'teacher-only'
            ? sync!.isHost
            : controllerConnectionId === sync!.myConnectionId
    );
    const canOperate = !isShared || isController;

    // --- RollerCoasterBlock｜状態管理 ---
    // コースターの現在位置 (0.0 = スタート, 1.0 = ゴール)。
    // 操作している本人は「ローカルで動かしているのと同じ」体感になるよう、常にローカルstateを真値として
    // 即座に反映する(サーバへの送信・受信の往復を待たない)。非操作者だけサーバの同期値をそのまま見る。
    const [localPositionX, setLocalPositionX] = useState(0);
    const syncedPositionX = (sync?.blockStates[id]?.positionX as number | undefined) ?? 0;
    const showsLocal = !isShared || canOperate;
    const positionX = showsLocal ? localPositionX : syncedPositionX;

    // 操作権を得た瞬間(individual→shared、非操作者→操作者になった時など)は、
    // サーバの現在値からローカルstateを初期化しておく(いきなり0に戻って見えないように)
    useEffect(() => {
        if (showsLocal) {
            setLocalPositionX(syncedPositionX);
        }
        // 操作権が変わったタイミングでだけ同期したいので、依存はshowsLocalのみに絞る
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showsLocal]);

    // --- RollerCoasterBlock｜入力値のバリデーション ---
    if (isInvalidHeight || isInvalidPeakHeight || mass <= 0 || gravity < 0 || initialVelocity < 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-red-50 border-2 border-red-200 rounded-2xl shadow-sm gap-4 text-center w-full">
                <span className="text-4xl">⚠️</span>
                <h3 className="font-bold text-red-700 text-lg">コースを生成できません</h3>
                <div className="text-sm text-red-600 text-left bg-white p-4 rounded-lg border border-red-100">
                    <p className="mb-2">計算または描画ができない数値が含まれています。以下を修正してください：</p>
                    <ul className="list-disc list-inside space-y-1">
                        {mass <= 0 && <li><strong>質量 (mass)</strong> は 0 より大きい値にしてください。</li>}
                        {gravity < 0 && <li><strong>重力加速度 (gravity)</strong> は 0 以上の値にしてください。</li>}
                        {isInvalidHeight && (<li><strong>高さ (initialHeight)</strong> は {trackShape === 'loop' ? '0' : '0 より大きい値'} にしてください。</li>)}
                        {isInvalidPeakHeight && (<li><strong>{trackShape === 'loop' ? 'ループ' : '山'}の高さ</strong> は 0 より大きい値にしてください。</li>)}
                        {initialVelocity < 0 && <li><strong>スタートの速度 (initialVelocity)</strong> は 0 以上の値にしてください。</li>}
                    </ul>
                </div>
            </div>
        );
    }

    // --- RollerCoasterBlock｜ロジック (物理演算) ---
    const baseHeight = trackShape === 'loop' ? 50 : initialHeight;

    // コースのx,h座標を返す関数
    const getTrackPos = (p: number) => {
        let x = p;
        let h = 0;

        if (trackShape === 'drop') {
            // コース全体がなだらかな下り坂
            h = ((1 + Math.cos(Math.PI * p)) / 2) * baseHeight;
        } else if (trackShape === 'camel-back') {
            // 最初の2/3は大きな山、最後の1/3は小さな山
            if (p <= 1 / 3) {
                h = ((1 + Math.cos(3 * Math.PI * p)) / 2) * baseHeight;
            } else {
                h = ((1 + Math.cos(3 * Math.PI * p)) / 6) * baseHeight;
            }
        } else if (trackShape === 'loop') {
            if (p <= 0.3) {
                // 第1段階：水平な一直線 (高さ0m)
                const lp = p / 0.3;
                x = 0.4 * lp;
                h = 0;
            } else if (p <= 0.6) {
                // 第2段階：正円のループ
                const lp = (p - 0.3) / 0.3;
                const theta = -Math.PI / 2 + 2 * Math.PI * lp;
                x = 0.4 + 0.1 * Math.cos(theta);
                h = (0.5 + 0.5 * Math.sin(theta)) * peakHeight;
            } else if (p <= 0.8) {
                // 第3段階：水平な一直線
                const sp = (p - 0.6) / 0.2;
                x = 0.4 + 0.3 * sp;
                h = 0;
            } else {
                // 第4段階：一直線の上り坂
                const cp = (p - 0.8) / 0.2;
                x = 0.7 + 0.3 * cp;
                h = cp * peakHeight * 1.5;
            }
        }
        return { x, h };
    };

    // 現在の各物理量を算出
    const currentPos = getTrackPos(positionX);
    const currentHeight = currentPos.h;

    const startPos = getTrackPos(0);
    const initialPotential = mass * gravity * startPos.h;
    const initialKinetic = 0.5 * mass * Math.pow(initialVelocity, 2);
    const totalEnergy = initialPotential + initialKinetic;              // 力学的エネルギー (一定)

    // エネルギー不足になる限界点を探す
    let maxPosition = 1.0;
    let prevP = 0;
    for (let p = 0.005; p <= 1.00001; p += 0.005) { // 200分割で大まかな限界点を探す
        const testP = Math.min(1.0, p);
        const testPos = getTrackPos(testP);
        const testPotential = mass * gravity * testPos.h;

        if (totalEnergy < testPotential) {
            let low = prevP;
            let high = testP;
            for (let i = 0; i < 15; i++) {
                const mid = (low + high) / 2;
                const midPos = getTrackPos(mid);
                const midPotential = mass * gravity * midPos.h;
                if (totalEnergy < midPotential) {
                    high = mid;
                } else {
                    low = mid;
                }
            }
            maxPosition = low;
            break;
        }
        prevP = testP;
    }

    // 現在位置が限界に達しているかの判定（計算上の微小な誤差を考慮）
    const isAtLimit = maxPosition < 1.0 && positionX >= maxPosition - 0.00001;

    const potentialEnergy = mass * gravity * currentHeight;             // 位置エネルギー (U = mgh)
    const kineticEnergy = Math.max(0, totalEnergy - potentialEnergy);   // 運動エネルギー (K = E - U)
    const velocity = Math.sqrt((2 * kineticEnergy) / mass);             // 速度 (v = √(2K/m))

    // --- RollerCoasterBlock｜UI描画用データの準備 ---
    // SVG描画用の高さの最大値を決定
    const displayMaxH = trackShape === 'loop'
        ? peakHeight * 2.5
        : initialHeight * 1.15;
    // SVGでコースの線を描画するための座標群を生成 (0〜1を100分割)
    const getSvgY = (h: number) => 100 - (h / displayMaxH) * 100;

    const trackPoints = Array.from({ length: 101 }).map((_, i) => {
        const p = i / 100;
        const pos = getTrackPos(p);
        return `${pos.x * 100},${getSvgY(pos.h)}`;
    }).join(' ');

    // SVG描画用データ計算
    const coasterCx = currentPos.x * 100;
    const coasterCy = getSvgY(currentHeight);

    // 車体を傾けるための角度計算
    const delta = 0.001;
    const nextP = Math.min(1, positionX + delta);
    prevP = positionX === 1 ? positionX - delta : positionX;
    const nextPos = getTrackPos(nextP);
    const prevPos = getTrackPos(prevP);

    const dy = getSvgY(nextPos.h) - getSvgY(prevPos.h);
    const dx = (nextPos.x - prevPos.x) * 100 * 2.0;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // --- RollerCoasterBlock｜UI ---
    // 文字サイズ等はcqw単位で自身の描画幅に応じて縮小するため、
    // ビューポート基準のブレークポイントではなく自身の描画幅を基準にするコンテナクエリ(@container)を使う
    // (縦/横の並び自体は幅による自動切り替えではなく、layoutプロパティで教員が明示的に指定する)
    // classroom内(sync !== null)でのみ、動的ブロックであることが3色で分かるように枠線を変える。
    // 個別ブロックの汎用ハイライトはしない(エディタ等sync === nullのときは従来通りの無地の枠)。
    const stateBorderClass = sync === null
        ? 'border-gray-100'
        : !isShared
            ? 'border-purple-300'  // 動的ブロックである印(individual)
            : canOperate
                ? 'border-emerald-400' // 操作可能
                : 'border-rose-300';   // 操作不可

    return (
        <div className={`@container relative flex flex-col p-4 bg-white border-2 ${stateBorderClass} rounded-2xl shadow-sm gap-4`}>

            {interactive && sync && sync.isHost && (
                <BlockPermissionBadge
                    mode={
                        effectiveSync === 'shared'
                            ? { sync: 'shared', controllerRule: effectiveControllerRule }
                            : { sync: 'individual' }
                    }
                    controllerConnectionId={controllerConnectionId}
                    roster={sync.roster}
                    onChangeMode={(mode: PermissionMode) => {
                        sync.send('setBlockPermission', {
                            blockId: id,
                            sync: mode.sync,
                            ...(mode.sync === 'shared' ? { controllerRule: mode.controllerRule } : {}),
                        });
                    }}
                    onAssign={(connectionId) => sync.send('assignControl', { blockId: id, connectionId })}
                    onRevoke={() => sync.send('revokeControl', { blockId: id })}
                />
            )}

            {/* メインレイアウト：シミュレーションと数値データの並び順はlayoutプロパティで切り替え */}
            <div className={`flex gap-4 ${layout === 'horizontal' ? 'flex-row' : 'flex-col'}`}>

                {/* シミュレーションと操作パネル */}
                <div className="flex-1 flex flex-col gap-3">

                    {/* シミュレーションエリア */}
                    <div className="bg-sky-50 rounded-xl p-3 @sm:p-4 border border-sky-100 w-full">
                        <div className="relative w-full aspect-[2/1]">

                            {/* 設定値 */}
                            <div className="absolute top-0 right-0 bg-white/70 backdrop-blur-sm border border-sky-100 text-gray-500 text-[clamp(7px,2.6cqw,11px)] px-2 py-1 rounded shadow-sm z-10 text-left pointer-events-none">
                                <p>質量　　　： <span className="font-mono text-gray-700">{mass}</span> kg</p>
                                <p>重力加速度： <span className="font-mono text-gray-700">{gravity}</span> m/s²</p>
                            </div>

                            {/* コース描画 */}
                            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <polyline
                                    points={trackPoints}
                                    fill="none"
                                    stroke="#94a3b8"
                                    strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                            {/* 初期地点 (START) の高さマーカー () */}
                            {(trackShape === 'drop' || trackShape === 'camel-back') && (
                                <div
                                    className="absolute bottom-0 flex flex-col items-center"
                                    style={{ left: '-1%', top: `${getSvgY(startPos.h)}%` }}
                                >
                                    <svg viewBox="0 0 10 6" className="w-[clamp(6px,2.2cqw,10px)] h-[clamp(3.6px,1.3cqw,6px)] text-gray-400 fill-current"><polygon points="5,0 0,6 10,6" /></svg>
                                    <div className="flex-1 border-l-2 border-dashed border-gray-300 w-0 my-0.5"></div>
                                    <div className="absolute top-1/2 left-3 -translate-y-1/2 text-[clamp(8px,2.8cqw,12px)] font-bold text-gray-500 whitespace-nowrap bg-sky-50/80 px-1 rounded">
                                        {baseHeight.toFixed(1)} m
                                    </div>
                                    <svg viewBox="0 0 10 6" className="w-[clamp(6px,2.2cqw,10px)] h-[clamp(3.6px,1.3cqw,6px)] text-gray-400 fill-current"><polygon points="5,6 0,0 10,0" /></svg>
                                </div>
                            )}

                            {/* ループの高さマーカー (loop) */}
                            {trackShape === 'loop' && (
                                <div
                                    className="absolute bottom-0 flex flex-col items-center"
                                    style={{
                                        left: '40%',
                                        top: `${getSvgY(peakHeight)}%`,
                                        transform: 'translateX(-50%)'
                                    }}
                                >
                                    <svg viewBox="0 0 10 6" className="w-[clamp(6px,2.2cqw,10px)] h-[clamp(3.6px,1.3cqw,6px)] text-gray-400 fill-current"><polygon points="5,0 0,6 10,6" /></svg>
                                    <div className="flex-1 border-l-2 border-dashed border-gray-300 w-0 my-0.5"></div>
                                    <div className="absolute top-1/2 left-3 -translate-y-1/2 text-[clamp(8px,2.8cqw,12px)] font-bold text-gray-500 whitespace-nowrap bg-sky-50/80 px-1 rounded">
                                        {peakHeight.toFixed(1)} m
                                    </div>
                                    <svg viewBox="0 0 10 6" className="w-[clamp(6px,2.2cqw,10px)] h-[clamp(3.6px,1.3cqw,6px)] text-gray-400 fill-current"><polygon points="5,6 0,0 10,0" /></svg>
                                </div>
                            )}

                            {/* エネルギー不足警告バッジ */}
                            {isAtLimit && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-600 text-white text-[clamp(8px,2.8cqw,12px)] font-bold px-[clamp(6px,2.5cqw,12px)] py-[clamp(3px,1.2cqw,6px)] rounded-full shadow-md z-20">
                                    ⚠️ これ以上進めません
                                </div>
                            )}

                            {/* トロッコ */}
                            <div
                                className="absolute w-0 h-0"
                                style={{
                                    left: `${coasterCx}%`,
                                    top: `${coasterCy}%`,
                                    transform: `rotate(${angle}deg)`,
                                    transformOrigin: 'center center',
                                    transition: 'none',
                                    zIndex: 10
                                }}
                            >
                                <svg
                                    viewBox="-8 -10 16 12"
                                    className="w-[clamp(24px,10cqw,40px)] h-[clamp(18px,7.5cqw,30px)] overflow-visible"
                                    style={{ transform: 'translate(-50%, -85%)' }}
                                >
                                    <rect x="-6" y="-10" width="12" height="7" rx="1.5" className="fill-red-500 shadow-sm" />
                                    <circle cx="-3.5" cy="-2" r="2.5" className="fill-gray-800" />
                                    <circle cx="3.5" cy="-2" r="2.5" className="fill-gray-800" />
                                </svg>
                            </div>

                        </div>
                    </div>

                    {/* 操作パネル */}
                    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-[clamp(8px,2.6cqw,12px)] font-bold text-gray-400">
                                <span>START</span>
                                <span className="text-blue-600">位置をスライドして動かそう</span>
                                <span>GOAL</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.001"
                                value={positionX}
                                // disabled属性は使わない(ブラウザ標準のグレー表示がTailwindのクラス指定と無関係に
                                // 付いてしまうため)。権限が無い場合はonChangeで無視するだけにし、見た目は変えない
                                onChange={(e) => {
                                    if (!canOperate) return;
                                    // スライダーの値を更新する際、エネルギー不足になる位置を超えないように制限
                                    const newP = Math.min(parseFloat(e.target.value), maxPosition);
                                    setLocalPositionX(newP); // 自分の操作は常に即座にローカル反映
                                    if (isShared) {
                                        // 他の閲覧者に伝えるためにサーバへも送るが、自分の表示はローカルstateのまま変えない
                                        sync!.send('blockStateUpdate', { blockId: id, state: { positionX: newP } });
                                    }
                                }}
                                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>
                    </div>
                </div>

                {/* 数値データ：横並び時は1列で縦積み、縦並び時は2列で横に並べる */}
                <div className={`grid gap-2 shrink-0 ${layout === 'horizontal' ? 'grid-cols-1 w-36' : 'grid-cols-2 w-full'}`}>
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <p className="text-[clamp(8px,2.4cqw,12px)] text-gray-500">高さ (h)</p>
                        <p className="text-[clamp(11px,4cqw,18px)] font-mono font-bold text-gray-800">{currentHeight.toFixed(1)} m</p>
                    </div>
                    <div className={`p-2 rounded-lg border ${isAtLimit ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                        <p className={`text-[clamp(8px,2.4cqw,12px)] ${isAtLimit ? 'text-red-500' : 'text-gray-500'}`}>速度 (v)</p>
                        <p className={`text-[clamp(11px,4cqw,18px)] font-mono font-bold ${isAtLimit ? 'text-red-600' : 'text-gray-800'}`}>
                            {velocity.toFixed(1)} m/s
                        </p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                        <p className="text-[clamp(8px,2.4cqw,12px)] text-blue-600">位置エネルギー (E)</p>
                        <p className="text-[clamp(11px,4cqw,18px)] font-mono font-bold text-blue-800">{Math.round(potentialEnergy)} J</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                        <p className="text-[clamp(8px,2.4cqw,12px)] text-green-600">運動エネルギー (K)</p>
                        <p className="text-[clamp(11px,4cqw,18px)] font-mono font-bold text-green-800">{Math.round(kineticEnergy)} J</p>
                    </div>
                </div>
            </div>
        </div>
    );
}