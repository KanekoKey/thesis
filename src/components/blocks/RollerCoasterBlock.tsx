'use client';

import { useState } from 'react';

// --- RollerCoasterBlock｜型定義 ---
export interface RollerCoasterBlockProps {
    mass?: number;                      // 質量 [kg]
    gravity?: number;                   // 重力加速度 [m/s²]
    initialHeight?: number;             // スタートの高さ [m]
    trackShape?: 'drop' | 'camel-back'; // コース形状(drop: 下り坂, camel-back: 大小二つの山)
}

export default function RollerCoasterBlock({
    mass = 10,
    gravity = 9.8,
    initialHeight = 50,
    trackShape = 'drop',
}: RollerCoasterBlockProps) {

    // --- RollerCoasterBlock｜状態管理 ---
    // コースターの現在位置 (0.0 = スタート, 1.0 = ゴール)
    const [positionX, setPositionX] = useState(0);

    // --- RollerCoasterBlock｜ロジック (物理演算) ---
    // 指定した位置(x)の高さを計算する関数
    const getTrackHeight = (x: number) => {
        let ratio = 0;
        if (trackShape === 'drop') {
            ratio = (1 + Math.cos(Math.PI * x)) / 2;
        } else if (trackShape === 'camel-back') {
            if (x <= 1 / 3) {
                // 前半：高さ 1.0 から 0.0 まで落ちる
                ratio = (1 + Math.cos(3 * Math.PI * x)) / 2;
            } else {
                // 後半：高さ 0.0 から 1/3 まで登って 0.0 に落ちる
                ratio = (1 + Math.cos(3 * Math.PI * x)) / 6;
            }
        }
        return ratio * initialHeight;
    };

    // 現在の各物理量を算出
    const currentHeight = getTrackHeight(positionX);
    const totalEnergy = mass * gravity * initialHeight; // 力学的エネルギー (一定)
    const potentialEnergy = mass * gravity * currentHeight; // 位置エネルギー (U = mgh)
    const kineticEnergy = Math.max(0, totalEnergy - potentialEnergy); // 運動エネルギー (K = E - U)
    const velocity = Math.sqrt((2 * kineticEnergy) / mass); // 速度 (v = √(2K/m))


    // --- RollerCoasterBlock｜UI描画用データの準備 ---
    // SVGでコースの線を描画するための座標群を生成 (0〜1を100分割)
    const getSvgY = (h: number) => 100 - (h / initialHeight) * 100;

    const trackPoints = Array.from({ length: 101 }).map((_, i) => {
        const x = i / 100;
        const yPercent = getSvgY(getTrackHeight(x));
        return `${x * 100},${yPercent}`;
    }).join(' ');

    // SVG描画用データ計算
    const coasterCx = positionX * 100;
    const coasterCy = getSvgY(currentHeight);

    // 車体を傾けるための角度計算
    const delta = 0.001;
    const nextX = Math.min(1, positionX + delta);
    const prevX = positionX === 1 ? positionX - delta : positionX;
    const dy = getSvgY(getTrackHeight(nextX)) - getSvgY(getTrackHeight(prevX));
    const dx = (nextX - prevX) * 100 * 2.0;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);


    // --- RollerCoasterBlock｜UI ---
    return (
        <div className="flex flex-col p-6 bg-white border-2 border-gray-100 rounded-2xl shadow-sm gap-6">

            {/* メインレイアウト：左側にシミュレーション、右側に数値データ */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* シミュレーションと操作パネル */}
                <div className="flex-1 flex flex-col gap-4">

                    {/* シミュレーションエリア */}
                    <div className="bg-sky-50 rounded-xl px-4 py-8 relative h-80 border border-sky-100">
                        <div className="relative w-full h-full">

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
                            {/* 初期地点 (START) の高さマーカー */}
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

                            {/* 山の高さマーカー (camel-back の時だけ表示) */}
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
                                onChange={(e) => setPositionX(parseFloat(e.target.value))}
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
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500">速度 (v)</p>
                        <p className="text-lg font-mono font-bold text-gray-800">{velocity.toFixed(1)} m/s</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600">位置エネルギー (E)</p>
                        <p className="text-lg font-mono font-bold text-blue-800">{Math.round(potentialEnergy)} J</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                        <p className="text-xs text-red-600">運動エネルギー (K)</p>
                        <p className="text-lg font-mono font-bold text-red-800">{Math.round(kineticEnergy)} J</p>
                    </div>
                </div>
            </div>
        </div>
    );

}