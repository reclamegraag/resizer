import { useEffect, useState, RefObject } from 'react';

export function useContainerWidth(ref: RefObject<HTMLElement>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

export function colsForWidth(w: number): number {
  if (w < 640) return 2;
  if (w < 880) return 3;
  if (w < 1200) return 4;
  return 5;
}
