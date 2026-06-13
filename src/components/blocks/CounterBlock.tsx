'use client';

import { useState } from 'react';
import type { CounterBlockData } from '@/types/block';

// --- CounterBlock｜型定義 ---
export const defaultCounterParams: Required<CounterBlockData['parameters']> = {
    initialCount: 0,
    step: 1,
    label: "",
};

export default function CounterBlock({
  initialCount = defaultCounterParams.initialCount,
  step = defaultCounterParams.step,
  label = defaultCounterParams.label
}: CounterBlockData['parameters']) {
  const [count, setCount] = useState(initialCount);

  // --- CounterBlock｜ロジック ---
  const handleIncrement = () => {
    setCount((prev) => prev + step);
  };

  // --- CounterBlock｜UI ---
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-blue-50 border-2 border-blue-100 rounded-2xl shadow-sm">
      <h3 className="text-xl font-bold text-blue-800 mb-6">{label}</h3>

      <div className="text-6xl font-mono font-bold text-gray-800 mb-8">
        {count}
      </div>

      <button
        onClick={handleIncrement}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xl font-bold rounded-xl shadow-md transition-all active:scale-95"
      >
        +{step} カウントアップ
      </button>

    </div>
  );
}