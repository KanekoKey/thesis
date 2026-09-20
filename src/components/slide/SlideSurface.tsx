import type { CSSProperties, ReactNode } from 'react';
import Block from '@/components/blocks/Block';
import type { BlockData, BlockLayout } from '@/types/block';
import { GRID_COLS, GRID_ROWS, SLIDE_HEIGHT, SLIDE_WIDTH } from '@/lib/slideGrid';

// ブロックが使うグリッドのセルを、CSS Grid の配置指定に変換する
export function gridPlacement(layout: BlockLayout): CSSProperties {
  return {
    gridColumn: `${layout.col + 1} / span ${layout.colSpan}`,
    gridRow: `${layout.row + 1} / span ${layout.rowSpan}`,
  };
}

// 論理サイズ固定(1280×720)のスライド本体。親グリッドとして 32×18 のセルを持つ。
// 実際の表示サイズは、この要素を包む側が transform: scale() で合わせる(FitSlide / ScaledSlide / エディタ)
export function SlideGrid({ children, style, ...rest }: React.HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div
      {...rest}
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// 教材提示(教員画面・生徒画面・サムネイル)用の、操作UIを持たないスライド描画
export default function SlideSurface({ blocks, interactive = true }: { blocks: BlockData[]; interactive?: boolean }) {
  return (
    <SlideGrid className="bg-white">
      {blocks.map((block) => (
        <div key={block.id} style={gridPlacement(block.layout)} className="relative min-w-0 min-h-0 p-1">
          {/* エディタ(GridBlockItem)と同じ枠・余白にして、見た目を揃える */}
          <div className="h-full w-full rounded-lg border-2 border-gray-300 bg-white p-2">
            <Block block={block} interactive={interactive} />
          </div>
        </div>
      ))}
    </SlideGrid>
  );
}
