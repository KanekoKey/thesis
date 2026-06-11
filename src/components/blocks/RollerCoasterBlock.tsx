'use client';

import { useState } from 'react';

// --- RollerCoasterBlock｜型定義 ---
export interface RollerCoasterBlockProps {
    mass?: number;                      // 質量 [kg]
    gravity?: number;                   // 重力加速度 [m/s²]
    initialHeight?: number;             // スタートの高さ [m]
    initialVelocity?: number;           // スタートの速度 [m/s]
    trackShape?: 'drop' | 'camel-back' | 'loop';
    // コース形状(drop: 下り坂, camel-back: 大小二つの山, loop: ループ)
}

export default function RollerCoasterBlock({
    mass = 10,
    gravity = 9.8,
    initialHeight = 50,
    initialVelocity = 0,
    trackShape = 'drop',
}: RollerCoasterBlockProps) {

    // --- RollerCoasterBlock｜状態管理 ---
    // コースターの現在位置 (0.0 = スタート, 1.0 = ゴール)
    const [positionX, setPositionX] = useState(0);


    // --- RollerCoasterBlock｜入力値のバリデーション ---
    if (initialHeight <= 0 || mass <= 0 || gravity < 0 || initialVelocity < 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-red-50 border-2 border-red-200 rounded-2xl shadow-sm gap-4 text-center w-full">
                <span className="text-4xl">⚠️</span>
                <h3 className="font-bold text-red-700 text-lg">コースを生成できません</h3>
                <div className="text-sm text-red-600 text-left bg-white p-4 rounded-lg border border-red-100">
                    <p className="mb-2">計算または描画ができない数値が含まれています。以下を修正してください：</p>
                    <ul className="list-disc list-inside space-y-1">
                        {initialHeight <= 0 && <li><strong>高さ (initialHeight)</strong> は 0 より大きい値にしてください。</li>}
                        {mass <= 0 && <li><strong>質量 (mass)</strong> は 0 より大きい値にしてください。</li>}
                        {gravity < 0 && <li><strong>重力加速度 (gravity)</strong> は 0 以上の値にしてください。</li>}
                        {initialVelocity < 0 && <li><strong>スタートの速度 (initialVelocity)</strong> は 0 以上の値にしてください。</li>}
                    </ul>
                </div>
            </div>
        );
    }

    // --- RollerCoasterBlock｜ロジック (物理演算) ---
    // コースのx,h座標を返す関数
    const getTrackPos = (p: number) => {
        let x = p;
        let h = 0;

        if (trackShape === 'drop') {
            // コース全体がなだらかな下り坂
            h = ((1 + Math.cos(Math.PI * p)) / 2) * initialHeight;
        } else if (trackShape === 'camel-back') {
            // 最初の2/3は大きな山、最後の1/3は小さな山
            if (p <= 1 / 3) {
                h = ((1 + Math.cos(3 * Math.PI * p)) / 2) * initialHeight;
            } else {
                h = ((1 + Math.cos(3 * Math.PI * p)) / 6) * initialHeight;
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
                h = (0.2 + 0.2 * Math.sin(theta)) * initialHeight;
            } else if (p <= 0.8) {
                // 第3段階：水平な一直線
                const sp = (p - 0.6) / 0.2;
                x = 0.4 + 0.3 * sp;
                h = 0;
            } else {
                // 第4段階：一直線の上り坂
                const cp = (p - 0.8) / 0.2;
                x = 0.7 + 0.3 * cp;
                h = 0.6 * cp * initialHeight;
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
    // SVGでコースの線を描画するための座標群を生成 (0〜1を100分割)
    const getSvgY = (h: number) => 100 - (h / initialHeight) * 100;

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
    return (
        <div className="flex flex-col p-6 bg-white border-2 border-gray-100 rounded-2xl shadow-sm gap-6">

            {/* メインレイアウト：左側にシミュレーション、右側に数値データ */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* シミュレーションと操作パネル */}
                <div className="flex-1 flex flex-col gap-4">

                    {/* シミュレーションエリア */}
                    <div className="bg-sky-50 rounded-xl p-4 sm:p-8 border border-sky-100 w-full">
                        <div className="relative w-full aspect-[2/1]">

                            {/* 設定値 */}
                            <div className="absolute top-0 right-0 bg-white/70 backdrop-blur-sm border border-sky-100 text-gray-500 text-[10px] sm:text-xs px-2 py-1 rounded shadow-sm z-10 text-left pointer-events-none">
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
                                    style={{ left: '-1%', top: '0%' }}
                                >
                                    <svg width="10" height="6" viewBox="0 0 10 6" className="text-gray-400 fill-current"><polygon points="5,0 0,6 10,6" /></svg>
                                    <div className="flex-1 border-l-2 border-dashed border-gray-300 w-0 my-0.5"></div>
                                    <div className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-gray-500 whitespace-nowrap bg-sky-50/80 px-1 rounded">
                                        {initialHeight.toFixed(1)} m
                                    </div>
                                    <svg width="10" height="6" viewBox="0 0 10 6" className="text-gray-400 fill-current"><polygon points="5,6 0,0 10,0" /></svg>
                                </div>
                            )}

                            {/* 山の高さマーカー (camel-back) */}
                            {trackShape === 'camel-back' && (
                                <div
                                    className="absolute bottom-0 flex flex-col items-center"
                                    style={{
                                        left: '66.66%',
                                        top: `${getSvgY(initialHeight / 3)}%`,
                                        transform: 'translateX(-50%)'
                                    }}
                                >
                                    <svg width="10" height="6" viewBox="0 0 10 6" className="text-gray-400 fill-current"><polygon points="5,0 0,6 10,6" /></svg>
                                    <div className="flex-1 border-l-2 border-dashed border-gray-300 w-0 my-0.5"></div>
                                    <div className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-gray-500 whitespace-nowrap bg-sky-50/80 px-1 rounded">
                                        {(initialHeight / 3).toFixed(1)} m
                                    </div>
                                    <svg width="10" height="6" viewBox="0 0 10 6" className="text-gray-400 fill-current"><polygon points="5,6 0,0 10,0" /></svg>
                                </div>
                            )}

                            {/* ループの高さマーカー (loop) */}
                            {trackShape === 'loop' && (
                                <div
                                    className="absolute bottom-0 flex flex-col items-center"
                                    style={{
                                        left: '40%',
                                        top: `${getSvgY(initialHeight * 0.4)}%`,
                                        transform: 'translateX(-50%)'
                                    }}
                                >
                                    <svg width="10" height="6" viewBox="0 0 10 6" className="text-gray-400 fill-current"><polygon points="5,0 0,6 10,6" /></svg>
                                    <div className="flex-1 border-l-2 border-dashed border-gray-300 w-0 my-0.5"></div>
                                    <div className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-gray-500 whitespace-nowrap bg-sky-50/80 px-1 rounded">
                                        {(initialHeight * 0.4).toFixed(1)} m
                                    </div>
                                    <svg width="10" height="6" viewBox="0 0 10 6" className="text-gray-400 fill-current"><polygon points="5,6 0,0 10,0" /></svg>
                                </div>
                            )}

                            {/* エネルギー不足警告バッジ */}
                            {isAtLimit && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-20">
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
                                    width="40" height="30"
                                    className="overflow-visible"
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
                    <div className="bg-gray-50 rounded-xl px-4 py-6 border border-gray-200">
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between text-xs font-bold text-gray-400">
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
                                onChange={(e) => {  // スライダーの値を更新する際、エネルギー不足になる位置を超えないように制限
                                    const newP = parseFloat(e.target.value);
                                    setPositionX(Math.min(newP, maxPosition));
                                }}
                                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>
                    </div>
                </div>

                {/* 数値データ：縦に並べる */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 w-full lg:w-48 shrink-0">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500">高さ (h)</p>
                        <p className="text-lg font-mono font-bold text-gray-800">{currentHeight.toFixed(1)} m</p>
                    </div>
                    <div className={`p-3 rounded-lg border ${isAtLimit ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                        <p className={`text-xs ${isAtLimit ? 'text-red-500' : 'text-gray-500'}`}>速度 (v)</p>
                        <p className={`text-lg font-mono font-bold ${isAtLimit ? 'text-red-600' : 'text-gray-800'}`}>
                            {velocity.toFixed(1)} m/s
                        </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600">位置エネルギー (E)</p>
                        <p className="text-lg font-mono font-bold text-blue-800">{Math.round(potentialEnergy)} J</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <p className="text-xs text-green-600">運動エネルギー (K)</p>
                        <p className="text-lg font-mono font-bold text-green-800">{Math.round(kineticEnergy)} J</p>
                    </div>
                </div>
            </div>
        </div>
    );

}