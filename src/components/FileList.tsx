import { FixedSizeList } from 'react-window';
import { useStore } from '../state/store';
import { FileRow } from './FileRow';
import { useEffect, useRef, useState } from 'react';

export function FileList() {
  const jobs = useStore((s) => s.jobs);
  const select = useStore((s) => s.select);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(300);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      setHeight(entries[0].contentRect.height);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  if (jobs.length === 0) return null;

  return (
    <div ref={wrapRef} className="flex-1 min-h-0 overflow-hidden">
      <FixedSizeList
        height={height}
        itemCount={jobs.length}
        itemSize={56}
        width="100%"
      >
        {({ index, style }) => (
          <div style={style}>
            <FileRow job={jobs[index]} onClick={() => select(jobs[index].id)} />
          </div>
        )}
      </FixedSizeList>
    </div>
  );
}
