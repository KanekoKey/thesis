'use client';

interface HostHeaderProps {
  roomId: string;
  activeIndex: number;
  slideCount: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function HostHeader({ roomId, activeIndex, slideCount, onPrev, onNext }: HostHeaderProps) {
  return (
    <header className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
      <div>
        <h1 className="font-bold text-gray-800">教員画面 (プレゼンター表示)</h1>
        <p className="text-sm text-gray-400">クラス: {roomId}</p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-gray-500 font-medium">
          スライド {activeIndex + 1} / {slideCount}
        </span>
        <button
          onClick={onPrev}
          disabled={activeIndex === 0}
          className="px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
        >
          ← 前へ
        </button>
        <button
          onClick={onNext}
          disabled={activeIndex === slideCount - 1}
          className="px-4 py-2 rounded-full bg-blue-600 text-white font-bold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition"
        >
          次へ →
        </button>
      </div>
    </header>
  );
}
