import { useLayoutEffect, useState, type RefObject } from 'react';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '@/lib/slideGrid';

// container の中にスライド(論理サイズ 1280×720)を余白なく収めるための拡大率を返す。
// container のサイズが変わるたびに再計測する。計測前は 0
export function useFitScale(containerRef: RefObject<HTMLElement | null>): number {
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const { clientWidth, clientHeight } = container;
      setScale(Math.min(clientWidth / SLIDE_WIDTH, clientHeight / SLIDE_HEIGHT));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  return scale;
}
