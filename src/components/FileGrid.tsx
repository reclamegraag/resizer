import { FixedSizeGrid } from 'react-window';
import { useRef } from 'react';
import { useStore } from '../state/store';
import { FileCard } from './FileCard';
import { useContainerWidth, colsForWidth } from '../lib/useContainerCols';

const GAP = 12;
const ROW_HEIGHT = 348;
const PADDING = 16;

export function FileGrid() {
  const jobs = useStore((s) => s.jobs);
  const select = useStore((s) => s.select);
  const wrapRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(wrapRef);

  if (jobs.length === 0) return null;

  const cols = colsForWidth(width);
  const innerW = Math.max(0, width - PADDING * 2);
  const colWidth = cols > 0 ? (innerW - GAP * (cols - 1)) / cols : 0;
  const rowCount = Math.ceil(jobs.length / cols);

  return (
    <div ref={wrapRef} className="flex-1 min-h-0 overflow-hidden px-4">
      {width > 0 && colWidth > 0 && (
        <FixedSizeGrid
          columnCount={cols}
          rowCount={rowCount}
          columnWidth={colWidth + GAP}
          rowHeight={ROW_HEIGHT}
          width={width - PADDING * 2 + GAP}
          height={rowCount * ROW_HEIGHT}
          style={{ overflow: 'visible' }}
        >
          {({ columnIndex, rowIndex, style }) => {
            const i = rowIndex * cols + columnIndex;
            if (i >= jobs.length) return null;
            const job = jobs[i];
            const adjusted = {
              ...style,
              width: colWidth,
              height: ROW_HEIGHT - GAP,
            };
            return (
              <div style={adjusted}>
                <FileCard
                  job={job}
                  index={i}
                  onClick={() => select(job.id)}
                />
              </div>
            );
          }}
        </FixedSizeGrid>
      )}
    </div>
  );
}
